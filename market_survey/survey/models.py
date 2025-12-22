from django.db import models
from django.contrib.auth import get_user_model
import uuid
User = get_user_model()

class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    # Image de couverture (optionnelle)
    image = models.ImageField(
        upload_to="survey_images/",
        null=True,
        blank=True,
        help_text="Image de couverture de l'enquête (optionnelle)."
    )

    owner = models.ForeignKey(
        User,
        related_name='surveys',
        on_delete=models.CASCADE,
        null=True,
        blank=True
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
        return f"Choix : {self.text}"


class Respondent(models.Model):
    SYNC_STATUS = (
        ('draft', 'Brouillon'),
        ('pending', 'En attente de synchro'),
        ('synced', 'Synchronisé'),
        ('error', 'Erreur de synchro'),
    )

    survey = models.ForeignKey(Survey, related_name='respondents', on_delete=models.CASCADE)
    interviewer_name = models.CharField(max_length=150)  # nom de l’enquêteur
    created_at = models.DateTimeField(auto_now_add=True)

    participant_name = models.CharField(max_length=150, blank=True)

    # NOUVEAUX CHAMPS POUR OFFLINE / MOBILE 
    client_uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=SYNC_STATUS, default='draft')
    updated_at_local = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    device_id = models.CharField(max_length=100, blank=True)
    app_version = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Répondant (Enquêteur: {self.interviewer_name})"



class Response(models.Model):
    respondent = models.ForeignKey(Respondent, related_name='answers', on_delete=models.CASCADE,null=True,blank=True)
    question = models.ForeignKey(Question, related_name='responses', on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True)
    
    selected_choices = models.ManyToManyField(Choice,
                                              blank=True,
                                              related_name="multiple_answers")
    
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Réponse à {self.question.text}"
