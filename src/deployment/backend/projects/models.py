from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name
