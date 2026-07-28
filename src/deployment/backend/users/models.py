from django.contrib.auth.models import AbstractUser
from django.db import models
import hashlib, base64, struct

class User(AbstractUser):
    email = models.EmailField(unique=True)
    address = models.TextField(blank=True, default='')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    avatar = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class SshKey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ssh_keys')
    name = models.CharField(max_length=255)
    public_key = models.TextField()
    fingerprint = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.fingerprint and self.public_key:
            self.fingerprint = self._compute_fingerprint(self.public_key)
        super().save(*args, **kwargs)

    @staticmethod
    def _compute_fingerprint(public_key: str) -> str:
        try:
            parts = public_key.strip().split()
            key_b64 = parts[1] if len(parts) >= 2 else parts[0]
            key_bytes = base64.b64decode(key_b64)
            digest = hashlib.sha256(key_bytes).digest()
            b64 = base64.b64encode(digest).decode().rstrip('=')
            return f'SHA256:{b64}'
        except Exception:
            return 'SHA256:unknown'

    def __str__(self):
        return f'{self.user.email}: {self.name}'

from django.db.models.signals import post_save
from django.dispatch import receiver
from backend.tblinc_client import TblincClient
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_member_incus_project(sender, instance, created, **kwargs):
    if created and not instance.is_staff and not instance.is_superuser:
        project_name = f"member-{instance.username}".lower().replace('_', '-').replace('.', '-')
        logger.info(f"Automatically provisioning Incus project namespace for new member {instance.email}: {project_name}")
        try:
            # 1. Create the project namespace
            with TblincClient() as client:
                payload = {
                    "name": project_name,
                    "description": f"Isolated sandbox namespace for member {instance.email}",
                    "config": {
                        "features.images": "true",
                        "features.networks": "true",
                        "features.profiles": "true",
                        "features.storage.volumes": "true"
                    }
                }
                client.create_project(payload)
                logger.info(f"Successfully provisioned project namespace: {project_name}")

            # 2. Create OVN network inside the project namespace
            with TblincClient(project=project_name) as client:
                net_payload = {
                    "name": "onet",
                    "type": "ovn",
                    "config": {
                        "network": "ovn-uplink"
                    }
                }
                client.create_network(net_payload)
                logger.info(f"Successfully provisioned OVN network 'onet' in project {project_name}")
 
            # 3. Update the default profile to bind root disk to pool local and eth0 to network onet
            with TblincClient(project=project_name) as client:
                profile_payload = {
                    "name": "default",
                    "description": f"Default profile for {project_name} instances",
                    "config": {},
                    "devices": {
                        "root": {
                            "type": "disk",
                            "path": "/",
                            "pool": "local"
                        },
                        "eth0": {
                            "type": "nic",
                            "network": "onet",
                            "name": "eth0"
                        }
                    }
                }
                client.update_profile("default", profile_payload)
                logger.info(f"Successfully updated default profile for project {project_name}")

            # 4. Copy default images to the isolated project image store
            import subprocess
            try:
                with TblincClient() as client:
                    images_res = client.list_images(recursion=1)
                    images = images_res.get("metadata", [])
                    for img in images:
                        fingerprint = img.get("fingerprint")
                        if fingerprint:
                            logger.info(f"Copying default image '{fingerprint}' to project {project_name}...")
                            subprocess.run([
                                "incus", "image", "copy",
                                fingerprint, "local:",
                                "--target-project", project_name
                            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                logger.exception(f"Failed to copy default images to project {project_name}")

        except Exception as e:
            logger.exception(f"Failed to automatically create Incus project namespace / configurations for {instance.email}")
