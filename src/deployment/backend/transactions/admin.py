from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'status', 'created_at')
    search_fields = ('uuid', 'status')

from .models import DepositRequest

@admin.register(DepositRequest)
class DepositRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'method', 'sender_number', 'tnx_id', 'status', 'created_at')
    list_filter = ('status', 'method')
    search_fields = ('user__username', 'tnx_id', 'sender_number')
    readonly_fields = ('created_at',)

from .models import WithdrawRequest

@admin.register(WithdrawRequest)
class WithdrawRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'method', 'account_details', 'status', 'created_at')
    list_filter = ('status', 'method')
    search_fields = ('user__username', 'account_details')
    readonly_fields = ('created_at',)
