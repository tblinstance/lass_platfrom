from django.db import models

class SysOs(models.Model):
    cpu = models.JSONField(default=dict, blank=True)
    memory = models.JSONField(default=dict, blank=True)
    storage = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return "System OS Resource Info"
