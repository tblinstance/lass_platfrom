from djoser.serializers import UserSerializer as DjoserUserSerializer, UserCreateSerializer as DjoserUserCreateSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import SshKey

User = get_user_model()

class CustomUserSerializer(DjoserUserSerializer):
    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = tuple(DjoserUserSerializer.Meta.fields) + ('is_staff', 'is_superuser', 'address', 'balance', 'avatar', 'location')
        read_only_fields = ('balance',)

class CustomUserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = tuple(DjoserUserCreateSerializer.Meta.fields) + ('address', 'balance', 'avatar', 'location', 'is_staff', 'is_superuser')

class SshKeySerializer(serializers.ModelSerializer):
    added_on = serializers.SerializerMethodField()

    class Meta:
        model = SshKey
        fields = ['id', 'name', 'public_key', 'fingerprint', 'added_on']
        read_only_fields = ['fingerprint', 'added_on']

    def get_added_on(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')
