from rest_framework import serializers
from .models import SysOs

class SysOsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SysOs
        fields = '__all__'
