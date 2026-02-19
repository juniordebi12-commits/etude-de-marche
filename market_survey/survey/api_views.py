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
        Decode 'questions' when request is multipart/form-data and questions arrives as a JSON string.
        """
        data = kwargs.get("data")

        if data is not None:
            if hasattr(data, "copy"):
                data = data.copy()

            raw_q = data.get("questions")
            if isinstance(raw_q, str):
                try:
                    parsed = json.loads(raw_q)
                    data["questions"] = parsed
                except Exception:
                    # if parsing fails, let DRF raise the error later
                    logger.debug("Could not parse questions JSON string", exc_info=True)

            kwargs["data"] = data

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
    CRUD for Respondent — useful for frontend deletion.
    """
    queryset = Respondent.objects.all().select_related("survey")
    serializer_class = RespondentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["survey"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # safe delete of related answers (DB cascade usually handles it)
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

    total_surveys = Survey.objects.filter(owner=user).count()

    total_responses = SurveyResponse.objects.filter(
        question__survey__owner=user
    ).count()

    qs = (
        Survey.objects.filter(owner=user)
        .annotate(responses=Count("questions__responses"))
        .order_by("-responses")[:10]
    )

    top = []
    for s in qs:
        top.append(
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "responses": s.responses or 0,
            }
        )

    return Response(
        {
            "total_surveys": total_surveys,
            "total_responses": total_responses,
            "top_surveys": top,
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