# billing/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class BillingAccount(models.Model):
    PLAN_FREE = "free"
    PLAN_PRO = "pro"
    PLAN_TEAM = "team"
    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_PRO, "Pro"),
        (PLAN_TEAM, "Team"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="billing")
    plan = models.CharField(max_length=32, choices=PLAN_CHOICES, default=PLAN_FREE)
    balance = models.BigIntegerField(default=0)  # credits (integer)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- Basic account operations (existing) ---
    def deposit(self, credits, reason=None):
        """Add credits and return new balance."""
        self.balance = (self.balance or 0) + int(credits)
        self.updated_at = timezone.now()
        self.save(update_fields=["balance", "updated_at"])
        Transaction.objects.create(
            account=self,
            amount=credits,
            type=Transaction.TYPE_DEPOSIT,
            note=reason,
        )
        return self.balance

    def withdraw(self, credits, reason=None):
        """Remove credits (no negative enforcement here; caller should check)."""
        self.balance = (self.balance or 0) - int(credits)
        self.updated_at = timezone.now()
        self.save(update_fields=["balance", "updated_at"])
        Transaction.objects.create(
            account=self,
            amount=-int(credits),
            type=Transaction.TYPE_WITHDRAWAL,
            note=reason,
        )
        return self.balance

    # --- New helper methods (A) ---
    def set_plan(self, plan_key, credits_included=0):
        """
        Change plan and optionally add included monthly credits.

        Usage:
            acct.set_plan("pro", credits_included=25000)
        This will set acct.plan and deposit the included credits.
        """
        if plan_key not in dict(self.PLAN_CHOICES).keys():
            raise ValueError(f"Unknown plan: {plan_key}")

        self.plan = plan_key
        self.updated_at = timezone.now()
        # deposit included credits if provided and > 0
        if credits_included and int(credits_included) > 0:
            # use deposit to record transaction
            self.deposit(int(credits_included), reason=f"plan_included:{plan_key}")
        else:
            # only save plan change
            self.save(update_fields=["plan", "updated_at"])
        return self

    @classmethod
    def ensure_for_user(cls, user):
        """
        Get or create a BillingAccount for a user.
        Returns (instance, created_bool) like get_or_create.
        """
        return cls.objects.get_or_create(user=user, defaults={"plan": cls.PLAN_FREE, "balance": 0})

    def get_balance(self):
        """Return current balance as int (0 if None)."""
        return int(self.balance or 0)

    def add_monthly_credits_if_needed(self, credits_amount):
        """
        Utility to add monthly included credits once. This is a simple helper;
        for production you may want to track last monthly grant to avoid duplicates.
        """
        if credits_amount and int(credits_amount) > 0:
            return self.deposit(int(credits_amount), reason="monthly_included")
        return self.balance

    def __str__(self):
        return f"{self.user.username} — {self.plan} — {self.balance} crédits"


class Transaction(models.Model):
    TYPE_DEPOSIT = "deposit"
    TYPE_WITHDRAWAL = "withdrawal"
    TYPE_CHOICES = [
        (TYPE_DEPOSIT, "Deposit"),
        (TYPE_WITHDRAWAL, "Withdrawal"),
    ]

    account = models.ForeignKey(BillingAccount, on_delete=models.CASCADE, related_name="transactions")
    amount = models.BigIntegerField()  # positive for deposit, negative for withdrawal
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.account.user.username} {self.type} {self.amount} ({self.created_at:%Y-%m-%d %H:%M})"


class PurchaseRecord(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    billing = models.ForeignKey(BillingAccount, on_delete=models.CASCADE, related_name="purchases")
    pack_id = models.CharField(max_length=64, blank=True, null=True)   # ex: c1,c2 or usage:model
    credits = models.BigIntegerField(default=0)                        # crédits ajoutés (+) ou consommés (-)
    amount_cents = models.BigIntegerField(null=True, blank=True)       # montant en centimes (optionnel)
    currency = models.CharField(max_length=8, default="FCFA")
    provider = models.CharField(max_length=50, blank=True, null=True)  # ex: stripe, paystack, openai-proxy
    provider_data = models.JSONField(blank=True, null=True)            # info brute / webhook payload
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def mark_completed(self, amount_cents=None, provider_payment_id=None):
        if amount_cents is not None:
            self.amount_cents = amount_cents
        if provider_payment_id:
            if self.provider_data is None:
                self.provider_data = {}
            self.provider_data["provider_payment_id"] = provider_payment_id
        self.status = self.STATUS_COMPLETED
        self.save(update_fields=["amount_cents", "provider_data", "status", "updated_at"])
        # if credits positive, credit the account; negative credits represent consumption and are not credited
        if self.credits and self.credits > 0:
            # deposit will create a Transaction record
            self.billing.deposit(self.credits, reason=f"PurchaseRecord #{self.pk}")

    def mark_failed(self, reason=None):
        self.status = self.STATUS_FAILED
        if self.provider_data is None:
            self.provider_data = {}
        if reason:
            self.provider_data["failure_reason"] = str(reason)
        self.save(update_fields=["status","provider_data","updated_at"])

    def __str__(self):
        return f"Purchase #{self.pk} - {self.billing.user.username} - {self.credits} crédits - {self.status}"
