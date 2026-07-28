from django.contrib import admin
from .models import Operation

@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'class_name', 'status', 'status_code', 'created_at')
    search_fields = ('uuid', 'class_name', 'status')
