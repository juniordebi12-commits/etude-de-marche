import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.db import transaction

from .models import BillingAccount, PurchaseRecord, Transaction
from .serializers import RegisterSerializer


logger = logging.getLogger(__name__)

DEFAULT_CREDIT_PACKS = getattr(
    settings,
    "BILLING_PACKS",
    [
        {
            "id": "c1",
            "name": "Pack Découverte",
            "credits": 10,
            "price_fcfa": 1000,
        },
        {
            "id": "c2",
            "name": "Pack Terrain",
            "credits": 40,
            "price_fcfa": 3000,
        },
        {
            "id": "c3",
            "name": "Pack Croissance",
            "credits": 100,
            "price_fcfa": 6000,
        },
        {
            "id": "c4",
            "name": "Pack Organisation",
            "credits": 250,
            "price_fcfa": 12000,
        },
    ],
)

# Actions facturées par SanaMetrics. Les actions gratuites (création manuelle,
# collecte, consultation) ne figurent volontairement pas dans cette liste.
USAGE_CREDIT_COSTS = {
    "export_pdf": 5,
    "export_excel": 5,
}

USAGE_LABELS = {
    "questionnaire": "Génération de questionnaire IA",
    "analysis": "Analyse IA d’enquête",
    "export_pdf": "Export PDF professionnel",
    "export_excel": "Export Excel professionnel",
}


def get_account(user):
    account, _ = BillingAccount.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "balance": 0},
    )
    return account


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_view(request):
    account = get_account(request.user)

    return Response(
        {
            "ok": True,
            "balance": account.get_balance(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def history_view(request):
    """
    Retourne uniquement l'historique du compte connecté.
    """
    account = get_account(request.user)

    ai_history = []

    for purchase in account.purchases.order_by("-created_at")[:30]:
        metadata = purchase.provider_data or {}
        is_ai_usage = str(purchase.pack_id or "").startswith("usage:")

        if is_ai_usage:
            action = metadata.get("action", "ia")
            ai_history.append(
                {
                    "id": purchase.id,
                    "action": action,
                    "label": USAGE_LABELS.get(action, "Utilisation IA"),
                    "credits": purchase.credits,
                    "status": purchase.status,
                    "created_at": purchase.created_at.isoformat(),
                }
            )

    def public_transaction_note(transaction):
        note = transaction.note or ""

        if note.startswith("Génération de questionnaire"):
            return USAGE_LABELS["questionnaire"]
        if note.startswith("Analyse d’enquête"):
            return USAGE_LABELS["analysis"]
        if note.startswith("Export PDF"):
            return USAGE_LABELS["export_pdf"]
        if note.startswith("Export Excel"):
            return USAGE_LABELS["export_excel"]
        if (
            note.startswith("Usage IA")
            or "tokens" in note.lower()
            or "gpt-" in note.lower()
        ):
            # Anciennes transactions de test enregistrées avant le nettoyage
            # des libellés publics.
            return "Utilisation IA"

        return note

    transactions = [
        {
            "id": transaction.id,
            "amount": transaction.amount,
            "type": transaction.type,
            "note": public_transaction_note(transaction),
            "created_at": transaction.created_at.isoformat(),
        }
        for transaction in account.transactions.order_by("-created_at")[:30]
    ]

    return Response(
        {
            "ok": True,
            "balance": account.get_balance(),
            "ai_history": ai_history,
            "transactions": transactions,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def consume_credits_view(request):
    """Débite une action professionnelle avant son exécution côté client."""
    payload = request.data or {}
    action = str(payload.get("action") or "")
    credits = USAGE_CREDIT_COSTS.get(action)

    if credits is None:
        return Response(
            {"ok": False, "error": "action_not_available"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        account = get_account(request.user)
        account = BillingAccount.objects.select_for_update().get(pk=account.pk)

        if account.get_balance() < credits:
            return Response(
                {
                    "ok": False,
                    "error": "Crédits insuffisants pour effectuer cet export.",
                    "credits_required": credits,
                    "balance": account.get_balance(),
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        account.withdraw(
            credits,
            reason=USAGE_LABELS[action],
        )

        PurchaseRecord.objects.create(
            billing=account,
            pack_id="usage:export",
            credits=-credits,
            amount_cents=0,
            currency="XAF",
            provider="sanametrics-export",
            provider_data={
                "action": action,
                "survey_id": payload.get("survey_id"),
                "source": payload.get("source", "application"),
            },
            status=PurchaseRecord.STATUS_COMPLETED,
        )

    return Response(
        {
            "ok": True,
            "credits_used": credits,
            "balance": account.get_balance(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_view(request):
    """
    Crée une demande d'achat en attente.

    Les crédits ne sont jamais ajoutés ici : ils seront ajoutés uniquement
    après validation du paiement par le prestataire choisi.
    """
    pack_id = (request.data or {}).get("pack_id")
    pack = next(
        (item for item in DEFAULT_CREDIT_PACKS if item["id"] == pack_id),
        None,
    )

    if not pack:
        return Response(
            {"ok": False, "error": "pack_not_found"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    account = get_account(request.user)

    purchase = PurchaseRecord.objects.create(
        billing=account,
        pack_id=pack["id"],
        credits=int(pack["credits"]),
        amount_cents=int(pack["price_fcfa"]) * 100,
        currency="XAF",
        provider="pending",
        provider_data={
            "pack_name": pack["name"],
            "price_fcfa": int(pack["price_fcfa"]),
        },
        status=PurchaseRecord.STATUS_PENDING,
    )

    return Response(
        {
            "ok": True,
            "status": "pending",
            "purchase_id": purchase.id,
            "pack": pack,
            "message": (
                "Votre demande d'achat a été créée. "
                "Les crédits seront ajoutés après confirmation du paiement."
            ),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def webhook_view(request):
    """
    À connecter plus tard au prestataire de paiement choisi.
    """
    return Response(
        {
            "ok": False,
            "detail": "Aucun prestataire de paiement n'est encore configuré.",
        },
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Compte créé avec succès"},
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
