from django.db import models

class Operation(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    class_name = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.uuid
