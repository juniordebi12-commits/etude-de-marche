# survey/serializers.py
from django.db import transaction
from rest_framework import serializers
from .models import Survey, Question, Choice, Response, Respondent
from cloudinary.models import CloudinaryField

# -------------------------
# Choice / Question / Survey
# -------------------------
class ChoiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Choice
        fields = ["id", "text"]


class QuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "order", "choices"]


class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    owner = serializers.ReadOnlyField(source="owner.username")
    has_responses = serializers.SerializerMethodField()
    # Champ image (upload + URL)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Survey
        fields = [
            "id",
            "title",
            "description",
            "image",
            "owner",
            "created_at",
            "updated_at",
            "has_responses",
            "questions",
        ]
    def get_has_responses(self, obj):
        return obj.respondents.exists()

    def validate_questions(self, value):
        if value is None:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError("questions doit être une liste.")
        for i, q in enumerate(value):
            text = q.get("text")
            if not text or not str(text).strip():
                raise serializers.ValidationError(
                    {f"questions[{i}].text": "Texte de question requis."}
                )
            qtype = q.get("question_type", "text")
            if qtype in ("single", "multiple"):
                choices = q.get("choices", [])
                if not choices or len(
                    [c for c in choices if c.get("text") and str(c.get("text")).strip()]
                ) == 0:
                    raise serializers.ValidationError(
                        {
                            f"questions[{i}].choices": "Au moins un choix requis pour ce type de question."
                        }
                    )
        return value

    def _create_or_update_choice(self, question, choice_data):
        cid = choice_data.get("id")
        # safe coercion
        try:
            cid = int(cid) if cid is not None else None
        except (ValueError, TypeError):
            cid = None

        text = (choice_data.get("text") or "").strip()
        if not text:
            raise serializers.ValidationError({"choices": "Texte du choix invalide."})
        if cid:
            try:
                c = Choice.objects.get(id=cid, question=question)
                c.text = text
                c.save()
                return c
            except Choice.DoesNotExist:
                return Choice.objects.create(question=question, text=text)
        else:
            return Choice.objects.create(question=question, text=text)
    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        with transaction.atomic():
            survey = Survey.objects.create(**validated_data)
            for i, qd in enumerate(questions_data):
                choices = qd.pop("choices", [])
                question = Question.objects.create(
                    survey=survey,
                    order=qd.get("order", i),
                    text=qd.get("text", ""),
                    question_type=qd.get("question_type", "text"),
                )
                for cd in choices:
                    self._create_or_update_choice(question, cd)
        return survey

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)

        if instance.respondents.exists():
            questions_data = None

        with transaction.atomic():
            # champs simples
            instance.title = validated_data.get("title", instance.title)
            instance.description = validated_data.get(
                "description", instance.description
            )

            # 🆕 gérer l'image : possibilité de mettre à jour ou de la laisser telle quelle
            if "image" in validated_data:
                instance.image = validated_data.get("image")

            instance.save()

            # gestion des questions
            if questions_data is not None:
                keep_q_ids = [q.get("id") for q in questions_data if q.get("id")]
                for old_q in list(instance.questions.all()):
                    if old_q.id not in keep_q_ids:
                        old_q.delete()

                for i, qd in enumerate(questions_data):
                    choices = qd.pop("choices", [])
                    qid = qd.get("id")
                    if qid:
                        try:
                            qobj = Question.objects.get(id=qid, survey=instance)
                            qobj.text = qd.get("text", qobj.text)
                            qobj.question_type = qd.get(
                                "question_type", qobj.question_type
                            )
                            qobj.order = qd.get("order", i)
                            qobj.save()

                            # on remplace les choix par ceux fournis
                            qobj.choices.all().delete()
                            for cd in choices:
                                self._create_or_update_choice(qobj, cd)
                        except Question.DoesNotExist:
                            qobj = Question.objects.create(
                                survey=instance,
                                order=qd.get("order", i),
                                text=qd.get("text", ""),
                                question_type=qd.get("question_type", "text"),
                            )
                            for cd in choices:
                                self._create_or_update_choice(qobj, cd)
                    else:
                        qobj = Question.objects.create(
                            survey=instance,
                            order=qd.get("order", i),
                            text=qd.get("text", ""),
                            question_type=qd.get("question_type", "text"),
                        )
                        for cd in choices:
                            self._create_or_update_choice(qobj, cd)

        return instance


# -------------------------
# Respondent serializer
# -------------------------
class RespondentSerializer(serializers.ModelSerializer):
    # require survey when creating respondent to satisfy DB NOT NULL constraint
    survey = serializers.PrimaryKeyRelatedField(
        queryset=Survey.objects.all(), required=True
    )

    class Meta:
        model = Respondent
        fields = ["id", "survey", "interviewer_name", "participant_name", "created_at"]
        read_only_fields = ["id", "created_at"]


# -------------------------
# Response serializer (amélioré)
# -------------------------
class ResponseSerializer(serializers.ModelSerializer):
    # expose l'id de l'enquête directement (lecture seule)
    survey_id = serializers.IntegerField(source="question.survey.id", read_only=True)

    # read: nested respondent object (pour afficher interviewer_name côté frontend)
    respondent = RespondentSerializer(read_only=True)

    # write: allow nested respondent data (create if provided) -- source="respondent"
    respondent_data = RespondentSerializer(
        source="respondent", write_only=True, required=False, allow_null=True
    )

    # keep respondent_id PK write option for backward compatibility
    respondent_id = serializers.PrimaryKeyRelatedField(
        source="respondent",
        queryset=Respondent.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    # selected_choices : accept primary keys for write + read as list of pks
    selected_choices = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Choice.objects.all(), required=False
    )

    # make answer_text optional (avoid "may not be null" errors)
    answer_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Response
        fields = [
            "id",
            "respondent",  # nested read-only
            "respondent_data",  # nested write-only (if client sends object)
            "respondent_id",  # write-only PK (if client sends id)
            "question",
            "survey_id",
            "answer_text",
            "selected_choices",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "respondent", "survey_id"]

    def _ensure_answer_text_not_null(self, validated_data):
        if "answer_text" not in validated_data or validated_data.get("answer_text") is None:
            validated_data["answer_text"] = ""
        return validated_data

    def _ensure_question_instance(self, validated_data):
        q = validated_data.get("question")
        from .models import Question as QuestionModel

        if isinstance(q, int):
            try:
                validated_data["question"] = QuestionModel.objects.get(pk=q)
            except QuestionModel.DoesNotExist:
                validated_data["question"] = None
        return validated_data

    def create(self, validated_data):
        validated_data = self._ensure_question_instance(validated_data)
        question_obj = validated_data.get("question", None)

        respondent_in_validated = validated_data.get("respondent", None)

        if isinstance(respondent_in_validated, dict):
            resp_fields = {
                k: v for k, v in respondent_in_validated.items() if v is not None
            }
            if question_obj and getattr(question_obj, "survey", None):
                resp_fields.setdefault("survey", question_obj.survey)
            if "survey" not in resp_fields or resp_fields.get("survey") is None:
                raise serializers.ValidationError(
                    {"respondent": "survey is required when creating respondent."}
                )
            resp_instance = Respondent.objects.create(**resp_fields)
            validated_data["respondent"] = resp_instance

        validated_data = self._ensure_answer_text_not_null(validated_data)

        choices = validated_data.pop("selected_choices", [])
        with transaction.atomic():
            response = super().create(validated_data)
            if choices:
                response.selected_choices.set(choices)
        return response

    def update(self, instance, validated_data):
        resp_obj_or_data = validated_data.pop("respondent", None)
        if isinstance(resp_obj_or_data, dict):
            if instance.respondent:
                for k, v in resp_obj_or_data.items():
                    setattr(instance.respondent, k, v)
                instance.respondent.save()
            else:
                resp_fields = {
                    k: v for k, v in resp_obj_or_data.items() if v is not None
                }
                try:
                    if instance.question and getattr(instance.question, "survey", None):
                        resp_fields.setdefault("survey", instance.question.survey)
                except Exception:
                    pass
                new_resp = Respondent.objects.create(**resp_fields)
                instance.respondent = new_resp
                instance.save()

        validated_data = self._ensure_answer_text_not_null(validated_data)

        choices = validated_data.pop("selected_choices", None)
        response = super().update(instance, validated_data)
        if choices is not None:
            response.selected_choices.set(choices)
        return response


# -------------------------
# Serializers dédiés à la synchro mobile (offline)
# -------------------------
class AnswerSyncSerializer(serializers.Serializer):
    """
    Utilisé par le frontend (web mobile / offline) pour envoyer une réponse à une question.
    """

    question_id = serializers.IntegerField()
    answer_text = serializers.CharField(allow_blank=True, required=False)
    selected_choices = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )


class RespondentSyncSerializer(serializers.Serializer):
    """
    Payload utilisé pour synchroniser une interview complète (1 respondent + toutes ses réponses).
    Ne modifie pas les serializers existants : canal séparé pour le mode offline/mobile.
    """

    client_uuid = serializers.UUIDField()
    survey_id = serializers.IntegerField()
    interviewer_name = serializers.CharField(max_length=150)
    participant_name = serializers.CharField(allow_blank=True, required=False)

    updated_at_local = serializers.DateTimeField()
    device_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    app_version = serializers.CharField(max_length=50, required=False, allow_blank=True)

    answers = AnswerSyncSerializer(many=True)

    def validate(self, attrs):
        survey_id = attrs.get("survey_id")
        if not Survey.objects.filter(id=survey_id).exists():
            raise serializers.ValidationError({"survey_id": "Survey introuvable."})
        return attrs
