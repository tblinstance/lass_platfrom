from django.db import models

class Usage(models.Model):
    cpu = models.JSONField(default=dict, blank=True)
    memory = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return "Usage Info"
