from django.db import models

class Server(models.Model):
    environment = models.JSONField(default=dict, blank=True)
    config = models.JSONField(default=dict, blank=True)
    api_version = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Server Info {self.api_version}"
