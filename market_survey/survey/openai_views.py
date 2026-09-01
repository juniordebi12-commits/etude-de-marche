import json
import logging
import math
from collections import Counter, defaultdict

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from billing.models import BillingAccount
from .models import Response as SurveyResponse
from .models import Survey, SurveyAIAnalysis


logger = logging.getLogger(__name__)

MOCK_OPENAI = getattr(settings, "MOCK_OPENAI", False)
MODEL_NAME = "gpt-4o-mini"
TOKENS_PER_CREDIT = 1000
SERVER_MAX_TOKENS = 2000
AI_ACTION_CREDITS = {
    "questionnaire": 5,
    "analysis": 8,
}


class InsufficientCreditsError(Exception):
    pass


class InvalidAIResponseError(Exception):
    pass


try:
    from billing.models import PurchaseRecord
except Exception:
    PurchaseRecord = None


def tokens_to_credits(tokens):
    return max(1, math.ceil(int(tokens or 0) / TOKENS_PER_CREDIT))


def estimate_messages_tokens(messages, max_tokens):
    content_length = sum(
        len(str(message.get("content", "")))
        for message in messages
        if isinstance(message, dict)
    )
    return math.ceil(content_length / 4) + int(max_tokens)


def get_billing_account(user):
    account, _ = BillingAccount.objects.get_or_create(
        user=user,
        defaults={"plan": "free", "balance": 0},
    )
    return account


def mock_questionnaire_response():
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
                "choices": [],
            },
            {
                "text": "Qu’avez-vous le plus apprécié dans ce service ?",
                "question_type": "text",
                "choices": [],
            },
            {
                "text": "Recommanderiez-vous ce service à un proche ?",
                "question_type": "single",
                "choices": [{"text": "Oui"}, {"text": "Non"}],
            },
        ],
    }


def mock_analysis_response(summary):
    return {
        "executive_summary": (
            f"L’enquête « {summary['survey_title']} » compte "
            f"{summary['respondent_count']} répondant(s) et "
            f"{summary['answer_count']} réponse(s) enregistrée(s). "
            "Les résultats doivent être interprétés avec prudence tant que "
            "la collecte reste limitée."
        ),
        "key_findings": [
            {
                "title": "Collecte disponible",
                "detail": (
                    f"{summary['respondent_count']} répondant(s) ont contribué "
                    "aux résultats actuellement visibles."
                ),
                "importance": "medium",
            },
            {
                "title": "Questions à approfondir",
                "detail": (
                    "Les répartitions par choix et les réponses numériques "
                    "permettent d’identifier les sujets prioritaires."
                ),
                "importance": "medium",
            },
        ],
        "recommendations": [
            "Poursuivre la collecte pour obtenir un échantillon plus représentatif.",
            "Examiner les questions dont les réponses sont les plus concentrées.",
            "Comparer les résultats après une nouvelle période de collecte.",
        ],
        "data_limitations": [
            "Cette analyse utilise uniquement des statistiques anonymisées.",
            "Les réponses ouvertes ne sont pas envoyées à l’IA.",
        ],
    }


def call_openai_and_charge(
    user,
    messages,
    max_tokens=512,
    temperature=0.2,
    mock_factory=None,
    action="questionnaire",
    usage_metadata=None,
):
    max_tokens = min(max(int(max_tokens), 1), SERVER_MAX_TOKENS)

    if not isinstance(messages, list) or not messages:
        raise ValueError("messages (liste) requis.")

    account = get_billing_account(user)

    if MOCK_OPENAI:
        response = (
            mock_factory()
            if mock_factory is not None
            else mock_questionnaire_response()
        )
        return response, 0, 0

    if OpenAI is None:
        raise RuntimeError("Le SDK OpenAI n’est pas installé.")

    api_key = getattr(settings, "OPENAI_API_KEY", None)

    if not api_key:
        raise RuntimeError("La clé OPENAI_API_KEY n’est pas configurée.")

    credits_needed = AI_ACTION_CREDITS.get(action)
    if credits_needed is None:
        raise ValueError("Action IA non prise en charge.")

    if account.get_balance() < credits_needed:
        raise InsufficientCreditsError(
            "Crédits insuffisants : "
            f"{credits_needed} requis, "
            f"{account.get_balance()} disponibles."
        )

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        response_format={"type": "json_object"},
    )

    total_tokens = int(getattr(response.usage, "total_tokens", 0) or 0)

    if account.get_balance() < credits_needed:
        raise InsufficientCreditsError(
            "Crédits insuffisants après génération de la réponse IA."
        )

    action_labels = {
        "questionnaire": "Génération de questionnaire",
        "analysis": "Analyse d’enquête",
    }

    with transaction.atomic():
        account.withdraw(
            credits_needed,
            reason=action_labels.get(action, "Utilisation IA"),
        )

        if PurchaseRecord is not None:
            metadata = {
                "tokens": total_tokens,
                "action": action,
            }

            if isinstance(usage_metadata, dict):
                metadata.update(usage_metadata)

            PurchaseRecord.objects.create(
                billing=account,
                pack_id=f"usage:{MODEL_NAME}",
                credits=-credits_needed,
                amount_cents=0,
                currency="XAF",
                provider="openai-proxy",
                provider_data=metadata,
                status=PurchaseRecord.STATUS_COMPLETED,
            )
    return response, credits_needed, total_tokens


def extract_json_response(response):
    content = response.choices[0].message.content or ""

    try:
        return json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise InvalidAIResponseError(
            "L’IA a retourné un format JSON invalide."
        ) from error


def build_survey_summary(survey):
    questions = list(survey.questions.prefetch_related("choices").all())

    answers = (
        SurveyResponse.objects.filter(respondent__survey=survey)
        .select_related("question")
        .prefetch_related("selected_choices")
    )

    answers_by_question = defaultdict(list)

    for answer in answers:
        answers_by_question[answer.question_id].append(answer)

    question_summaries = []

    for question in questions:
        question_answers = answers_by_question.get(question.id, [])
        choice_counts = Counter()
        numeric_values = []

        for answer in question_answers:
            for choice in answer.selected_choices.all():
                choice_counts[choice.text] += 1

            if question.question_type == "number":
                try:
                    numeric_values.append(float(answer.answer_text))
                except (TypeError, ValueError):
                    pass

        item = {
            "question": question.text,
            "type": question.question_type,
            "answer_count": len(question_answers),
        }

        if choice_counts:
            item["choice_distribution"] = dict(choice_counts.most_common())

        if numeric_values:
            item["numeric_summary"] = {
                "average": round(sum(numeric_values) / len(numeric_values), 2),
                "minimum": min(numeric_values),
                "maximum": max(numeric_values),
            }

        if question.question_type == "text":
            item["open_response_count"] = len(question_answers)

        question_summaries.append(item)

    return {
        "survey_title": survey.title,
        "survey_description": survey.description or "",
        "respondent_count": survey.respondents.count(),
        "answer_count": answers.count(),
        "question_count": len(questions),
        "questions": question_summaries,
        "privacy_note": (
            "Aucun nom de répondant, enquêteur ou texte de réponse libre "
            "n’est inclus dans ce résumé."
        ),
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_proxy(request):
    payload = request.data or {}
    messages = payload.get("messages") or []

    try:
        max_tokens = int(payload.get("max_tokens", 700))
    except (TypeError, ValueError):
        max_tokens = 700

    try:
        response, credits_used, tokens = call_openai_and_charge(
            request.user,
            messages,
            max_tokens=max_tokens,
            action="questionnaire",
        )

        if MOCK_OPENAI and isinstance(response, dict):
            return Response(
                {
                    "ok": True,
                    "template": response,
                    "credits_used": credits_used,
                }
            )

        template = extract_json_response(response)

        if not isinstance(template, dict) or not isinstance(
            template.get("questions"), list
        ):
            raise InvalidAIResponseError(
                "Le questionnaire généré est incomplet ou invalide."
            )

        return Response(
            {
                "ok": True,
                "template": template,
                "credits_used": credits_used,
            }
        )

    except InsufficientCreditsError as error:
        return Response(
            {"ok": False, "error": str(error)},
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )
    except (ValueError, InvalidAIResponseError) as error:
        return Response(
            {"ok": False, "error": str(error)},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception:
        logger.exception("Erreur pendant la génération IA")
        return Response(
            {
                "ok": False,
                "error": "Impossible de générer le questionnaire pour le moment.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_survey(request, survey_id):
    if request.user.is_staff or request.user.is_superuser:
        accessible_surveys = Survey.objects.all()
    else:
        accessible_surveys = Survey.objects.filter(owner=request.user)

    survey = get_object_or_404(accessible_surveys, pk=survey_id)
    summary = build_survey_summary(survey)

    if summary["respondent_count"] == 0 or summary["answer_count"] == 0:
        return Response(
            {
                "ok": False,
                "error": "Cette enquête ne contient pas encore de réponses à analyser.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    messages = [
        {
            "role": "system",
            "content": """
Tu es un analyste d’études de marché.
Tu reçois uniquement un résumé statistique anonymisé d’une enquête.

Retourne uniquement un objet JSON valide avec cette structure :

{
  "executive_summary": "Synthèse en 2 à 4 phrases",
  "key_findings": [
    {
      "title": "Constat court",
      "detail": "Interprétation factuelle basée sur les données",
      "importance": "high | medium | low"
    }
  ],
  "recommendations": [
    "Recommandation concrète et prudente"
  ],
  "data_limitations": [
    "Limite liée à la taille ou à la nature des données"
  ]
}

Règles :
- Ne jamais inventer de chiffre ou de réponse.
- Signaler clairement les limites d’un petit échantillon.
- Donner 3 à 5 constats et 3 recommandations maximum.
- Rester en français, clair et professionnel.
            """.strip(),
        },
        {
            "role": "user",
            "content": json.dumps(summary, ensure_ascii=False),
        },
    ]

    try:
        response, credits_used, tokens = call_openai_and_charge(
            request.user,
            messages,
            max_tokens=900,
            temperature=0.2,
            mock_factory=lambda: mock_analysis_response(summary),
            action="analysis",
            usage_metadata={
                "survey_id": survey.id,
                "survey_title": survey.title,
            },
        )

        if MOCK_OPENAI and isinstance(response, dict):
            analysis = response
        else:
            analysis = extract_json_response(response)

        if not isinstance(analysis, dict):
            raise InvalidAIResponseError("Le format de l’analyse est invalide.")

        saved_analysis = SurveyAIAnalysis.objects.create(
            survey=survey,
            owner=request.user,
            summary=summary,
            analysis=analysis,
            credits_used=credits_used,
            tokens=tokens,
        )

        return Response(
            {
                "ok": True,
                "analysis_id": saved_analysis.id,
"created_at": saved_analysis.created_at.isoformat(),
                "survey": {
                    "id": survey.id,
                    "title": survey.title,
                },
                "summary": summary,
                "analysis": analysis,
                "credits_used": credits_used,
            }
        )

    except InsufficientCreditsError as error:
        return Response(
            {"ok": False, "error": str(error)},
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )
    except (ValueError, InvalidAIResponseError) as error:
        return Response(
            {"ok": False, "error": str(error)},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception:
        logger.exception("Erreur pendant l’analyse IA")
        return Response(
            {
                "ok": False,
                "error": "Impossible de générer l’analyse IA pour le moment.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analysis_history(request):
    """
    Retourne les dernières analyses IA de l'utilisateur connecté.
    Optionnellement filtrées par enquête : ?survey_id=12
    """
    analyses = SurveyAIAnalysis.objects.filter(owner=request.user)

    survey_id = request.query_params.get("survey_id")
    if survey_id:
        analyses = analyses.filter(survey_id=survey_id)

    analyses = analyses.select_related("survey")[:20]

    return Response(
        {
            "ok": True,
            "analyses": [
                {
                    "id": item.id,
                    "survey": {
                        "id": item.survey_id,
                        "title": item.survey.title,
                    },
                    "summary": item.summary,
                    "analysis": item.analysis,
                    "credits_used": item.credits_used,
                    "created_at": item.created_at.isoformat(),
                }
                for item in analyses
            ],
        }
    )
