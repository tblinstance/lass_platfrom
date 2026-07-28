from django.db import models

class Configuration(models.Model):
    key = models.CharField(max_length=255, unique=True)
    value = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.key
