from rest_framework import serializers
from .models import Network, DnsRule

class NetworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Network
        fields = '__all__'

class DnsRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DnsRule
        fields = '__all__'
