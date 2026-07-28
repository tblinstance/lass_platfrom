from django.contrib import admin
from .models import Image

@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('fingerprint', 'size', 'architecture', 'type', 'public', 'created_at')
    search_fields = ('fingerprint', 'architecture', 'type')
