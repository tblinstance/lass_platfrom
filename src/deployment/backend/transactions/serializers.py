from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Transaction, DepositRequest, WithdrawRequest

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class DepositRequestSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = DepositRequest
        fields = '__all__'

class WithdrawRequestSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = WithdrawRequest
        fields = '__all__'
