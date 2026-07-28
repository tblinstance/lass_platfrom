from django.contrib import admin
from .models import StoragePool

@admin.register(StoragePool)
class StoragePoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'driver', 'status')
    search_fields = ('name', 'driver', 'status')
