from django.db import models

class StoragePool(models.Model):
    name = models.CharField(max_length=255, unique=True)
    driver = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name
