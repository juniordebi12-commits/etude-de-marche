# survey/api_views.py
import json
import logging

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from django.contrib.auth import get_user_model

from .models import Survey, Response as SurveyResponse, Respondent, Question, Choice
from .serializers import (
    SurveySerializer,
    ResponseSerializer,
    RespondentSerializer,
    RespondentSyncSerializer,
)
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

logger = logging.getLogger(__name__)
User = get_user_model()


# Permission: owner can edit/delete, others read-only
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(obj, "owner", None) == request.user


class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all().prefetch_related("questions__choices")
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["owner"]

    # allow JSON + multipart (for image upload)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user

    # Admin : voit tout
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return Survey.objects.all()

    # Utilisateur normal : voit SEULEMENT ses enquêtes
        if user.is_authenticated:
            return Survey.objects.filter(owner=user)

    # Public : rien
        return Survey.objects.all()

    def get_serializer(self, *args, **kwargs):
        """
        Décode les questions envoyées dans un formulaire multipart
        lors de l'upload d'une image.
        """
        data = kwargs.get("data")

        if data is not None:
            raw_questions = data.get("questions")

            if isinstance(raw_questions, str):
                try:
                    questions = json.loads(raw_questions)

                    # QueryDict ne gère pas correctement les objets imbriqués.
                    # On le convertit en dictionnaire standard avant de remettre
                    # la liste de questions décodée.
                    normalized_data = {
                        key: data.get(key)
                        for key in data.keys()
                        if key != "questions"
                    }

                    normalized_data["questions"] = questions
                    kwargs["data"] = normalized_data

                except json.JSONDecodeError:
                    logger.warning(
                        "Impossible de décoder les questions envoyées avec l'image."
                    )

        return super().get_serializer(*args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticatedOrReadOnly])
    def summary(self, request, pk=None):
        survey = self.get_object()
        serializer = self.get_serializer(survey)
        return Response(serializer.data)


class RespondentViewSet(viewsets.ModelViewSet):
    """
    Gestion des répondants.
    Un utilisateur normal ne voit que les répondants de ses propres enquêtes.
    """

    serializer_class = RespondentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["survey"]

    def get_queryset(self):
        user = self.request.user

        queryset = Respondent.objects.select_related("survey").all()

        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return queryset

        if user.is_authenticated:
            return queryset.filter(survey__owner=user)

        return queryset.none()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.answers.all().delete()

        return super().destroy(request, *args, **kwargs)


class ResponseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Response.
    Supports:
      - GET /api/responses/?survey=<id>
      - POST /api/responses/ (single)
      - POST /api/responses/bulk/ (bulk create)
    """
    queryset = SurveyResponse.objects.select_related("respondent", "question").prefetch_related(
        "selected_choices"
    )
    serializer_class = ResponseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["respondent", "question"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # ADMIN = TOUT VOIR
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            pass  # aucun filtre

        # USER NORMAL = seulement ses enquêtes
        elif user.is_authenticated:
            qs = qs.filter(question__survey__owner=user)

        # filtre optionnel par survey
        survey_id = self.request.query_params.get("survey")
        if survey_id:
            qs = qs.filter(question__survey__id=survey_id)

        return qs


    def perform_create(self, serializer):
        """
        Accept payload formats:
         - respondent_id (existing PK)
         - respondent (object) -> create Respondent (we ensure survey if possible)
         - respondent_data (write-only) handled by serializer via source="respondent"
        """
        with transaction.atomic():
            data = getattr(self, "request").data or {}

            # legacy: nested 'respondent' dict
            if isinstance(data.get("respondent"), dict):
                resp_data = data.get("respondent") or {}
                qid = data.get("question")
                survey_ref = None
                if qid:
                    try:
                        question = Question.objects.select_related("survey").get(pk=qid)
                        survey_ref = question.survey
                    except Question.DoesNotExist:
                        survey_ref = None

                respondent_obj = Respondent.objects.create(
                    survey=survey_ref,
                    interviewer_name=resp_data.get("interviewer_name") or resp_data.get("name") or "",
                    participant_name=resp_data.get("participant_name", "") or "",
                    created_by=survey_ref.owner if survey_ref else None
                )
                serializer.save(respondent=respondent_obj)
                return

            # default: serializer handles respondent_id / respondent_data
            question = serializer.validated_data.get("question")
            survey_owner = question.survey.owner if question and question.survey else None

            serializer.save(created_by=survey_owner)        
            return

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticatedOrReadOnly])
    def bulk(self, request):
        payload = request.data or {}
        items = payload.get("responses") or payload.get("data") or []
        if not isinstance(items, list) or len(items) == 0:
            return Response(
                {"detail": "expected 'responses' list in body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []
        with transaction.atomic():
            for idx, item in enumerate(items):
                ser = self.get_serializer(data=item)
                if not ser.is_valid():
                    errors.append({"index": idx, "errors": ser.errors})
                    break
                try:
                    instance = ser.save()
                    created.append(self.get_serializer(instance).data)
                except Exception as e:
                    errors.append({"index": idx, "exception": str(e)})
                    break

            if errors:
                transaction.set_rollback(True)
                return Response({"created": created, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"created": created}, status=status.HTTP_201_CREATED)


# ---------- utilitaire detection admin ----------
def is_admin_flag(user):
    """
    Return True if user should be considered admin by frontend.
    Checks: role=='admin', is_admin, isAdmin, is_staff, is_superuser.
    """
    if not user:
        return False
    role = getattr(user, "role", None)
    if role and str(role).strip().lower() == "admin":
        return True
    if getattr(user, "is_admin", False) is True:
        return True
    if getattr(user, "isAdmin", False) is True:
        return True
    if getattr(user, "is_staff", False) is True:
        return True
    if getattr(user, "is_superuser", False) is True:
        return True
    return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Return a small user object for the frontend, including admin flags.
    """
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email or "",
            "is_staff": bool(user.is_staff),
            "is_superuser": bool(user.is_superuser),
            "is_admin": bool(user.is_staff or user.is_superuser or getattr(user, "is_admin", False)),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    user = request.user

    # Un administrateur peut voir toutes les enquêtes.
    if user.is_staff or user.is_superuser:
        surveys = Survey.objects.all()
    else:
        surveys = Survey.objects.filter(owner=user)

    available_surveys = list(
        surveys.order_by("title").values("id", "title")
    )

    survey_id = request.query_params.get("survey_id")

    if survey_id and survey_id != "all":
        surveys = surveys.filter(id=survey_id)

# Important : cette ligne doit être hors du if.
# Elle fonctionne donc pour une enquête ou pour toutes les enquêtes.
    survey_ids = list(surveys.values_list("id", flat=True))
    # Liste des enquêteurs disponibles pour la ou les enquêtes sélectionnées.
    available_interviewers = list(
        Respondent.objects.filter(survey_id__in=survey_ids)
        .exclude(interviewer_name__isnull=True)
        .exclude(interviewer_name__exact="")
        .values_list("interviewer_name", flat=True)
        .distinct()
        .order_by("interviewer_name")
    )

    # Filtres optionnels : période et enquêteur.
    date_from = request.query_params.get("from")
    date_to = request.query_params.get("to")
    interviewer_name = request.query_params.get("interviewer")

    respondents_qs = Respondent.objects.filter(survey_id__in=survey_ids)
    responses_qs = SurveyResponse.objects.filter(
        question__survey_id__in=survey_ids
    )

    if interviewer_name:
        respondents_qs = respondents_qs.filter(
            interviewer_name=interviewer_name
        )
        responses_qs = responses_qs.filter(
            respondent__interviewer_name=interviewer_name
        )

    if date_from:
        respondents_qs = respondents_qs.filter(created_at__date__gte=date_from)
        responses_qs = responses_qs.filter(created_at__date__gte=date_from)

    if date_to:
        respondents_qs = respondents_qs.filter(created_at__date__lte=date_to)
        responses_qs = responses_qs.filter(created_at__date__lte=date_to)

    total_surveys = surveys.count()
    total_respondents = respondents_qs.count()
    total_responses = responses_qs.count()
    

    # Nombre de questions par enquête, pour calculer le taux de complétion.
    question_counts = {
        item["survey_id"]: item["total"]
        for item in Question.objects.filter(
            survey_id__in=survey_ids
        ).values("survey_id").annotate(
            total=Count("id")
        )
    }

    expected_answers = sum(
        question_counts.get(respondent.survey_id, 0)
        for respondent in respondents_qs.only("survey_id")
    )

    completion_rate = (
        round((total_responses / expected_answers) * 100, 1)
        if expected_answers
        else 0
    )

    # Répartition des réponses et répondants par enquête.
    responses_per_survey = {
        item["question__survey_id"]: item["total"]
        for item in responses_qs.values(
            "question__survey_id"
        ).annotate(
            total=Count("id")
        )
    }

    respondents_per_survey = {
        item["survey_id"]: item["total"]
        for item in respondents_qs.values(
            "survey_id"
        ).annotate(
            total=Count("id")
        )
    }

    surveys_data = []

    for survey in surveys.order_by("-updated_at"):
        response_count = responses_per_survey.get(survey.id, 0)
        respondent_count = respondents_per_survey.get(survey.id, 0)
        question_count = question_counts.get(survey.id, 0)

        expected_for_survey = respondent_count * question_count

        survey_completion = (
            round((response_count / expected_for_survey) * 100, 1)
            if expected_for_survey
            else 0
        )

        surveys_data.append({
            "id": survey.id,
            "title": survey.title,
            "description": survey.description or "",
            "responses": response_count,
            "respondents": respondent_count,
            "questions": question_count,
            "completion_rate": survey_completion,
            "created_at": timezone.localtime(
                survey.created_at
            ).strftime("%d/%m/%Y"),
            "updated_at": timezone.localtime(
                survey.updated_at
            ).strftime("%d/%m/%Y %H:%M"),
        })

    top_surveys = sorted(
        surveys_data,
        key=lambda survey: survey["responses"],
        reverse=True,
    )[:10]

    active_surveys = sum(
        1 for survey in surveys_data if survey["respondents"] > 0
    )

    # Répartition par enquêteur.
    interviewer_stats = []

    interviewer_data = respondents_qs.values(
        "interviewer_name"
    ).annotate(
        respondents=Count("id")
    ).order_by("-respondents")

    for item in interviewer_data:
        interviewer_stats.append({
            "name": item["interviewer_name"] or "Non renseigné",
            "respondents": item["respondents"],
        })

    # Activité sur les 30 derniers jours.
    thirty_days_ago = timezone.now() - timedelta(days=30)

    activity_data = respondents_qs.filter(
        created_at__gte=thirty_days_ago
    ).extra(
        {"day": "DATE(created_at)"}
    ).values(
        "day"
    ).annotate(
        respondents=Count("id")
    ).order_by("day")

    daily_activity = []

    for item in activity_data:
        day = item["day"]

        daily_activity.append({
            "date": str(day),
            "respondents": item["respondents"],
        })

    surveys_without_responses = [
        {
            "id": survey["id"],
            "title": survey["title"],
        }
        for survey in surveys_data
        if survey["respondents"] == 0
    ][:5]

    return Response(
        {
            # Compatibilité avec ton dashboard actuel
            "total_surveys": total_surveys,
            "total_responses": total_responses,
            "top_surveys": top_surveys,
            "available_surveys": available_surveys,
            "available_interviewers": available_interviewers,

            # Nouveaux indicateurs
            "total_respondents": total_respondents,
            "active_surveys": active_surveys,
            "completion_rate": completion_rate,
            "interviewer_stats": interviewer_stats,
            "daily_activity": daily_activity,
            "surveys_without_responses": surveys_without_responses,
        },
        status=status.HTTP_200_OK,
    )


# -------------------------------------------------
# Endpoint for mobile/offline sync
# -------------------------------------------------
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def mobile_sync_respondent(request):
    """
    Reçoit une interview complète. 
    Le nom de l'interviewer est automatiquement forcé avec le nom du propriétaire de l'enquête.
    """
    ser = RespondentSyncSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data = ser.validated_data
    client_uuid = data["client_uuid"]
    survey_id = data["survey_id"]
    participant_name = data.get("participant_name", "")
    updated_at_local = data["updated_at_local"]
    answers_payload = data["answers"]

    try:
        # On récupère l'enquête pour accéder à son propriétaire (owner)
        survey = Survey.objects.select_related('owner').get(id=survey_id)
    except Survey.DoesNotExist:
        return Response({"survey_id": ["Survey introuvable."]}, status=status.HTTP_400_BAD_REQUEST)

    # --- LOGIQUE D'IDENTIFICATION AUTOMATIQUE ---
    # On utilise le username du créateur du lien comme nom de collecteur
    auto_interviewer_name = survey.owner.username if survey.owner else "Anonyme"

    with transaction.atomic():
        try:
            # On cherche si ce répondant existe déjà (cas de mise à jour/synchro multiple)
            respondent = Respondent.objects.select_for_update().get(client_uuid=client_uuid, survey=survey)

            if respondent.updated_at_local and respondent.updated_at_local >= updated_at_local:
                return Response(
                    {
                        "detail": "Version plus récente déjà présente sur le serveur.",
                        "respondent_id": respondent.id,
                        "client_uuid": str(respondent.client_uuid),
                    },
                    status=status.HTTP_200_OK,
                )

            # Mise à jour de l'existant
            respondent.interviewer_name = auto_interviewer_name
            respondent.participant_name = participant_name
            respondent.status = "synced"
            respondent.save()

            # Nettoyage des anciennes réponses pour ré-écriture
            SurveyResponse.objects.filter(respondent=respondent).delete()

        except Respondent.DoesNotExist:
            # Création du nouveau répondant avec le nom forcé
            respondent = Respondent.objects.create(
                survey=survey,
                interviewer_name=auto_interviewer_name,
                participant_name=participant_name,
                client_uuid=client_uuid,
                status="synced",
                created_by=survey.owner  # On lie techniquement la réponse au compte du proprio
            )

        # Création des réponses associées
        for ans in answers_payload:
            qid = ans.get("question_id")
            answer_text = ans.get("answer_text", "") or ""
            selected_choices_ids = ans.get("selected_choices", []) or []

            try:
                question = Question.objects.get(id=qid, survey=survey)
                answer_obj = SurveyResponse.objects.create(
                    respondent=respondent,
                    question=question,
                    answer_text=answer_text,
                    created_by=survey.owner
                )

                if selected_choices_ids:
                    choices = Choice.objects.filter(id__in=selected_choices_ids, question=question)
                    answer_obj.selected_choices.set(choices)
            except Question.DoesNotExist:
                logger.warning("mobile_sync: question %s non trouvée pour l'enquête %s", qid, survey_id)
                continue

    return Response(
        {
            "detail": "Synchro réussie",
            "respondent_id": respondent.id,
            "client_uuid": str(respondent.client_uuid),
            "interviewer_assigned": auto_interviewer_name
        },
        status=status.HTTP_200_OK,
    )