from rest_framework import serializers
from .models import StoragePool

class StoragePoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoragePool
        fields = '__all__'
