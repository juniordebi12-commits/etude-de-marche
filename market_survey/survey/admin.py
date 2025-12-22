from django.contrib import admin

from .models import Survey, Question, Response

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

class SurveyAdmin(admin.ModelAdmin):
    inlines = [QuestionInline]

admin.site.register(Survey, SurveyAdmin)
admin.site.register(Response)
