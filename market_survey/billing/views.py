import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.shortcuts import get_object_or_404

from .models import BillingAccount
from .serializers import BillingAccountSerializer

logger = logging.getLogger(__name__)

# default mapping (fallback to settings override)
DEFAULT_PLAN_CREDITS = getattr(settings, "BILLING_DEFAULT_CREDITS", {"free": 0, "pro": 25000, "team": 200000})

# available packs (must match frontend IDs if you want)
DEFAULT_CREDIT_PACKS = getattr(settings, "BILLING_PACKS", [
    {"id": "c1", "name": "Pack Découverte", "credits": 5000, "price": "4 900 FCFA"},
    {"id": "c2", "name": "Pack Pro", "credits": 25000, "price": "19 900 FCFA"},
    {"id": "c3", "name": "Pack Volume", "credits": 120000, "price": "79 900 FCFA"},
])

# optional PurchaseRecord model: used to keep trace of purchases (if present)
try:
    from .models import PurchaseRecord
except Exception:
    PurchaseRecord = None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_view(request):
    """
    GET /api/billing/balance/
    Returns: { balance: int, plan: str }
    """
    account, created = BillingAccount.objects.get_or_create(
        user=request.user,
        defaults={"plan": "free", "balance": DEFAULT_PLAN_CREDITS.get("free", 0)}
    )
    return Response({"ok": True, "balance": account.balance or 0, "plan": account.plan})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_view(request):
    """
    POST /api/billing/purchase/
    Body: { pack_id: "c1" } OR { credits: 1000 } (direct credits)
    Returns: { ok: True, balance: <new_balance>, purchase_id?: <id>, credits_deposited: int }
    NOTE: real payment processing should validate payment & webhook before deposit.
    Here we simulate an immediate deposit for dev; in production create an order and wait for payment confirmation.
    """
    data = request.data or {}
    pack_id = data.get("pack_id")
    credits = data.get("credits")

    # resolve pack
    if pack_id:
        pack = next((p for p in DEFAULT_CREDIT_PACKS if p["id"] == pack_id), None)
        if pack is None:
            return Response({"ok": False, "error": "pack_not_found"}, status=status.HTTP_400_BAD_REQUEST)
        credits_to_deposit = int(pack["credits"])
        note = f"Purchase {pack.get('name')}"
    elif credits is not None:
        try:
            credits_to_deposit = int(credits)
        except Exception:
            return Response({"ok": False, "error": "invalid_credits"}, status=status.HTTP_400_BAD_REQUEST)
        if credits_to_deposit <= 0:
            return Response({"ok": False, "error": "credits_must_be_positive"}, status=status.HTTP_400_BAD_REQUEST)
        note = "Manual credit top-up"
    else:
        return Response({"ok": False, "error": "pack_id_or_credits_required"}, status=status.HTTP_400_BAD_REQUEST)

    account, created = BillingAccount.objects.get_or_create(
        user=request.user,
        defaults={"plan": "free", "balance": DEFAULT_PLAN_CREDITS.get("free", 0)}
    )

    # In a real system: create PurchaseRecord with STATUS_PENDING and return checkout info.
    # For dev: perform immediate deposit and optionally record a completed PurchaseRecord.
    try:
        new_balance = account.deposit(credits_to_deposit, reason=note)
    except Exception as e:
        logger.exception("Failed to deposit credits for user %s", request.user)
        return Response({"ok": False, "error": "deposit_failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    purchase_id = None
    if PurchaseRecord is not None:
        try:
            pr = PurchaseRecord.objects.create(
                billing=account,
                pack_id=pack_id or "manual",
                credits=credits_to_deposit,
                amount_cents=data.get("amount_cents"),
                currency=data.get("currency", "FCFA"),
                provider=data.get("provider", "manual"),
                provider_data=data.get("provider_data"),
                status=PurchaseRecord.STATUS_COMPLETED,
            )
            purchase_id = pr.pk
        except Exception:
            logger.exception("Failed to create PurchaseRecord for user %s", request.user)

    return Response({
        "ok": True,
        "balance": new_balance,
        "credits_deposited": credits_to_deposit,
        "purchase_id": purchase_id,
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])  # provider webhook usually unauthenticated (use signature verification)
def webhook_view(request):
    """
    Minimal webhook stub for payment provider callbacks.
    In production: verify signature, map provider fields -> PurchaseRecord, call mark_completed/mark_failed.
    Example expected payload for testing:
      { "purchase_id": 12, "status": "completed", "amount_cents": 490000 }
    """
    payload = request.data or {}
    purchase_id = payload.get("purchase_id")
    status_str = payload.get("status")
    provider_payment_id = payload.get("provider_payment_id")
    if not purchase_id:
        return Response({"ok": False, "detail": "missing purchase_id"}, status=status.HTTP_400_BAD_REQUEST)
    if PurchaseRecord is None:
        return Response({"ok": False, "detail": "PurchaseRecord model not available"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    pr = get_object_or_404(PurchaseRecord, pk=purchase_id)
    if status_str in ("completed", "success"):
        pr.mark_completed(amount_cents=payload.get("amount_cents"), provider_payment_id=provider_payment_id)
        return Response({"ok": True, "status": pr.status})
    else:
        pr.mark_failed(reason=payload.get("reason", "provider_failed"))
        return Response({"ok": True, "status": pr.status})
