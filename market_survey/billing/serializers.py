from rest_framework import serializers
from .models import BillingAccount, Transaction

class BillingAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAccount
        fields = ["user", "plan", "balance", "created_at", "updated_at"]
        read_only_fields = ["user", "balance", "created_at", "updated_at"]

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "amount", "type", "note", "created_at"]
        read_only_fields = ["id", "created_at"]
