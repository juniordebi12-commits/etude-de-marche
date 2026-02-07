from django.db import models
from django.contrib.auth import get_user_model
import uuid
from cloudinary.models import CloudinaryField

User = get_user_model()


class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    image = CloudinaryField(
        "survey_image",
        blank=True,
        null=True
    )

    owner = models.ForeignKey(
    User,
    related_name='surveys',
    on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    survey = models.ForeignKey(Survey, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=500)

    QUESTION_TYPES = (
        ('text', "Texte libre"),
        ('single', 'Choix unique'),
        ('multiple', 'Choix multiple'),
        ('number', 'Réponse numérique'),
    )

    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='text')
    order = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=200)

    def __str__(self):
        return self.text


class Respondent(models.Model):
    SYNC_STATUS = (
        ('draft', 'Brouillon'),
        ('pending', 'En attente'),
        ('synced', 'Synchronisé'),
        ('error', 'Erreur'),
    )

    survey = models.ForeignKey(Survey, related_name='respondents', on_delete=models.CASCADE)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    interviewer_name = models.CharField(max_length=150)
    participant_name = models.CharField(max_length=150, blank=True)

    client_uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=SYNC_STATUS, default='draft')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.interviewer_name


class Response(models.Model):
    respondent = models.ForeignKey(
        Respondent,
        related_name='answers',
        on_delete=models.CASCADE
    )

    question = models.ForeignKey(
        Question,
        related_name='responses',
        on_delete=models.CASCADE
    )

    # 🔴 CLÉ CRITIQUE POUR ISOLER LES DONNÉES PAR USER
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    answer_text = models.TextField(blank=True)

    selected_choices = models.ManyToManyField(
        Choice,
        blank=True,
        related_name="responses"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Réponse à {self.question.text}"
