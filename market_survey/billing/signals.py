from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import BillingAccount

User = get_user_model()

DEFAULT_PLAN_CREDITS = getattr(settings, "BILLING_DEFAULT_CREDITS", {"free": 0, "pro": 25000, "team": 200000})

@receiver(post_save, sender=User)
def create_billing_account_for_new_user(sender, instance, created, **kwargs):
    if created:
        BillingAccount.objects.get_or_create(user=instance, defaults={
            "plan": "free",
            "balance": DEFAULT_PLAN_CREDITS.get("free", 0)
        })
