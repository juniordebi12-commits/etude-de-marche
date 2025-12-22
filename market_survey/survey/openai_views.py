import os
import math
import openai
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from billing.models import BillingAccount

# mode mock (True = pas d'appel OpenAI réel)
MOCK_OPENAI = getattr(settings, "MOCK_OPENAI", False)

# PurchaseRecord optionnel
try:
    from billing.models import PurchaseRecord
except Exception:
    PurchaseRecord = None

openai.api_key = os.environ.get("OPENAI_API_KEY")

# conversion tokens → crédits
TOKENS_PER_CREDIT = 1000
SERVER_MAX_TOKENS = 2000


def tokens_to_credits(tokens: int) -> int:
    return math.ceil(tokens / TOKENS_PER_CREDIT)


# -------------------------------
# MOCK IA — FORMAT COMPATIBLE EDITOR
# -------------------------------
def mock_openai_response(messages, max_tokens):
    return {
        "title": "Étude de satisfaction des consommateurs",
        "description": (
            "Ce questionnaire vise à évaluer la perception et le niveau "
            "de satisfaction des clients vis-à-vis d’un service."
        ),
        "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
        "questions": [
            {
                "text": "Quel est votre niveau de satisfaction global ?",
                "question_type": "number",
                "choices": []
            },
            {
                "text": "Qu’avez-vous le plus apprécié dans ce service ?",
                "question_type": "text",
                "choices": []
            },
            {
                "text": "Recommanderiez-vous ce service à un proche ?",
                "question_type": "single",
                "choices": [
                    {"text": "Oui"},
                    {"text": "Non"}
                ]
            }
        ]
    }


# -------------------------------
# APPEL IA + DÉBIT CRÉDITS
# -------------------------------
def call_openai_and_charge(user, messages, model="gpt-4o-mini", max_tokens=512, temperature=0.2):
    if max_tokens > SERVER_MAX_TOKENS:
        max_tokens = SERVER_MAX_TOKENS

    # MOCK
    if MOCK_OPENAI:
        resp = mock_openai_response(messages, max_tokens)
        total_tokens = 0
        credits_needed = 0
    else:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        usage = getattr(resp, "usage", {}) or {}
        total_tokens = int(usage.get("total_tokens") or 0)
        credits_needed = tokens_to_credits(total_tokens)

    billing, _ = BillingAccount.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "balance": 0}
    )

    if billing.balance < credits_needed:
        raise ValueError(
            f"Crédits insuffisants : {credits_needed} requis, {billing.balance} disponibles"
        )

    if credits_needed > 0:
        with transaction.atomic():
            try:
                billing.withdraw(
                    credits_needed,
                    reason=f"Usage IA ({model}) — {total_tokens} tokens"
                )
            except Exception:
                billing.balance -= credits_needed
                billing.save(update_fields=["balance", "updated_at"])

            if PurchaseRecord is not None:
                PurchaseRecord.objects.create(
                    billing=billing,
                    pack_id=f"usage:{model}",
                    credits=-credits_needed,
                    amount_cents=0,
                    currency="XAF",
                    provider="openai-proxy",
                    provider_data={"tokens": total_tokens},
                    status=getattr(PurchaseRecord, "STATUS_COMPLETED", "completed"),
                )

    return resp, credits_needed, total_tokens


# -------------------------------
# ENDPOINT API
# -------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_proxy(request):
    payload = request.data or {}
    messages = payload.get("messages") or []
    model = payload.get("model", "gpt-4o-mini")

    try:
        max_tokens = int(payload.get("max_tokens", 512))
    except Exception:
        max_tokens = 512

    if not isinstance(messages, list) or not messages:
        return Response(
            {"detail": "messages (list) requis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resp, credits_used, tokens = call_openai_and_charge(
            request.user,
            messages,
            model=model,
            max_tokens=max_tokens
        )

        # CAS MOCK : on renvoie directement le template
        if MOCK_OPENAI and isinstance(resp, dict):
            return Response({
                "ok": True,
                "template": resp,
                "credits_used": credits_used,
                "tokens": tokens,
            })

        # CAS IA RÉELLE (texte)
        assistant = None
        if getattr(resp, "choices", None):
            choice = resp.choices[0]
            assistant = getattr(choice, "message", None) or getattr(choice, "text", None)

        return Response({
            "ok": True,
            "response": assistant,
            "usage": getattr(resp, "usage", None),
            "credits_used": credits_used,
            "tokens": tokens,
        })

    except ValueError as e:
        return Response(
            {"ok": False, "error": str(e)},
            status=status.HTTP_402_PAYMENT_REQUIRED
        )
    except openai.error.OpenAIError as e:
        return Response(
            {"ok": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {"ok": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
