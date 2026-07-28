from django.contrib import admin
from .models import SysOs

@admin.register(SysOs)
class SysOsAdmin(admin.ModelAdmin):
    list_display = ('id',)
