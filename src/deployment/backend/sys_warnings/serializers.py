from rest_framework import serializers
from .models import SysWarning

class SysWarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = SysWarning
        fields = '__all__'
