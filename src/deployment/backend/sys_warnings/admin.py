from django.contrib import admin
from .models import SysWarning

@admin.register(SysWarning)
class SysWarningAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'severity', 'status', 'first_seen', 'last_seen')
    search_fields = ('uuid', 'severity', 'status', 'message')
