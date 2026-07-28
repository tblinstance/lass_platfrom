from django.db import models

class Instance(models.Model):
    name = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    architecture = models.CharField(max_length=50)
    created_at = models.DateTimeField(null=True, blank=True)
    config = models.JSONField(default=dict, blank=True)
    devices = models.JSONField(default=dict, blank=True)
    project = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name
