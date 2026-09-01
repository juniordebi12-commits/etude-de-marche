import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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
            labels = {
                "questionnaire": "Génération de questionnaire",
                "analysis": "Analyse d’enquête",
                "ia": "Utilisation IA",
            }

            ai_history.append(
                {
                    "id": purchase.id,
                    "action": action,
                    "label": labels.get(action, "Utilisation IA"),
                    "credits": purchase.credits,
                    "tokens": metadata.get("tokens", 0),
                    "status": purchase.status,
                    "created_at": purchase.created_at.isoformat(),
                }
            )

    transactions = [
        {
            "id": transaction.id,
            "amount": transaction.amount,
            "type": transaction.type,
            "note": transaction.note or "",
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