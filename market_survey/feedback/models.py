from django.db import models
from django.conf import settings

class Feedback(models.Model):
    FEEDBACK_TYPES = [
        ("bug", "Bug"),
        ("idea", "Suggestion"),
        ("ux", "Incompréhension"),
        ("other", "Autre"),
    ]

    type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    message = models.TextField()
    page = models.CharField(max_length=255, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.created_at.strftime('%Y-%m-%d')}"
