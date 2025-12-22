# billing/api_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import BillingAccount, PurchaseRecord
from django.conf import settings

# config packs côté serveur (synchronisé avec frontend constants)
CREDIT_PACKS = {
    "c1": {"name": "Pack Découverte", "credits": 5000, "amount_cents": 490000},
    "c2": {"name": "Pack Pro", "credits": 25000, "amount_cents": 1990000},
    "c3": {"name": "Pack Volume", "credits": 120000, "amount_cents": 7990000},
}

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_view(request):
    acct, _ = BillingAccount.ensure_for_user(request.user)
    return Response({
        "ok": True,
        "balance": acct.get_balance(),
        "plan": acct.plan,
    }, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_view(request):
    """
    Body: { "pack_id": "c1" } OR { "pack_id": "manual", "credits": 10000, "note": "offline" }
    Returns PurchaseRecord data (id, status, ...). If payment provider integration exists,
    you should return provider checkout URL or session id.
    """
    body = request.data or {}
    pack_id = body.get("pack_id")
    acct, _ = BillingAccount.ensure_for_user(request.user)

    # Manual credit top-up (admin/manual)
    if pack_id == "manual":
        credits = int(body.get("credits", 0))
        pr = PurchaseRecord.objects.create(
            billing=acct,
            pack_id="manual",
            credits=credits,
            amount_cents=body.get("amount_cents"),
            currency=body.get("currency", "FCFA"),
            provider="manual",
            status=PurchaseRecord.STATUS_COMPLETED
        )
        pr.mark_completed(amount_cents=body.get("amount_cents"))
        return Response({"ok": True, "purchase_id": pr.id, "balance": acct.get_balance()}, status=status.HTTP_201_CREATED)

    # pack based
    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        return Response({"ok": False, "detail": "pack_id invalide"}, status=status.HTTP_400_BAD_REQUEST)

    # créer PurchaseRecord pending -> in real: create provider checkout session and return session url
    pr = PurchaseRecord.objects.create(
        billing=acct,
        pack_id=pack_id,
        credits=pack["credits"],
        amount_cents=pack["amount_cents"],
        currency="FCFA",
        provider="external",   # ex: stripe/paystack
        status=PurchaseRecord.STATUS_PENDING,
        provider_data={"note": "checkout_not_implemented"}
    )

    # si pas d'intégration de paiement, on peut directement marquer completed en dev:
    # pr.mark_completed(amount_cents=pack["amount_cents"])

    return Response({
        "ok": True,
        "purchase_id": pr.id,
        "status": pr.status,
        "credits": pr.credits,
        # "checkout_url": "<provider url>"  # si intégré
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([AllowAny])  # provider webhook usually unauthenticated (use signature verification)
def webhook_view(request):
    """
    Webhook endpoint pour provider. Do verification (signature) en prod.
    Corps attendu: provider payload contenant purchase_id / provider_payment_id / status.
    Exemple minimal pour test local:
      { "purchase_id": 12, "status": "completed", "provider_payment_id": "ch_abc" }
    """
    payload = request.data or {}
    purchase_id = payload.get("purchase_id")
    status_str = payload.get("status")
    provider_payment_id = payload.get("provider_payment_id")
    if not purchase_id:
        return Response({"ok": False, "detail": "missing purchase_id"}, status=status.HTTP_400_BAD_REQUEST)
    pr = get_object_or_404(PurchaseRecord, pk=purchase_id)
    if status_str in ("completed", "success"):
        pr.mark_completed(amount_cents=payload.get("amount_cents"), provider_payment_id=provider_payment_id)
        return Response({"ok": True, "status": pr.status})
    else:
        pr.mark_failed(reason=payload.get("reason", "provider_failed"))
        return Response({"ok": True, "status": pr.status})
