from django.contrib import admin
from .models import BillingAccount, Transaction

@admin.register(BillingAccount)
class BillingAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "balance", "updated_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("created_at", "updated_at")

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("account", "type", "amount", "created_at")
    search_fields = ("account__user__username",)
    readonly_fields = ("created_at",)
