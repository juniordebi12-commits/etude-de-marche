from django.contrib import admin
from .models import Feedback

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "short_message", "user", "page", "created_at")
    list_filter = ("type", "created_at")
    search_fields = ("message", "page")
    readonly_fields = ("created_at",)

    def short_message(self, obj):
        return obj.message[:50] + ("..." if len(obj.message) > 50 else "")
    short_message.short_description = "Message"

