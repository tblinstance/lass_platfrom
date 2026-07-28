from django.db import models

class SysWarning(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    first_seen = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    message = models.TextField(blank=True, null=True)
    severity = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.uuid
