from django.contrib import admin
from .models import Instance

@admin.register(Instance)
class InstanceAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'type', 'architecture', 'created_at')
    search_fields = ('name', 'status', 'type')
