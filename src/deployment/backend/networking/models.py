from django.db import models

class Network(models.Model):
    name = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    config = models.JSONField(default=dict, blank=True)
    project = models.CharField(max_length=255, null=True, blank=True)
    managed = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class DnsRule(models.Model):
    subdomain = models.CharField(max_length=255, unique=True)
    target_instance = models.CharField(max_length=255)
    project = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.subdomain
