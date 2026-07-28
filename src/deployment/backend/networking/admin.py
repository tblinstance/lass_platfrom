from django.contrib import admin
from .models import Network

@admin.register(Network)
class NetworkAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'status')
    search_fields = ('name', 'type', 'status')
