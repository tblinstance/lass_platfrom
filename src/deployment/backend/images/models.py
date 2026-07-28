from django.db import models

class Image(models.Model):
    fingerprint = models.CharField(max_length=255, unique=True)
    size = models.BigIntegerField(null=True, blank=True)
    architecture = models.CharField(max_length=50, null=True, blank=True)
    type = models.CharField(max_length=50, null=True, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    public = models.BooleanField(default=False)
    created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.fingerprint
