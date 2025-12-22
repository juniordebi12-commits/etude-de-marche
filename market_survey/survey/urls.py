# survey/urls.py
from django.urls import path, include
from rest_framework import routers

from . import views
from .api_views import SurveyViewSet, ResponseViewSet, RespondentViewSet
from .api_views import mobile_sync_respondent
from .openai_views import chat_proxy

# ---------- ROUTER API ----------
router = routers.DefaultRouter()
router.register(r"surveys", SurveyViewSet, basename="api-surveys")
router.register(r"responses", ResponseViewSet, basename="api-responses")
router.register(r"respondents", RespondentViewSet, basename="api-respondents")

# ---------- URLS ----------
urlpatterns = [

    # ------- Legacy templates (HTML) -------
    path("", views.survey_list, name="survey_list"),
    path("create/", views.survey_create, name="survey_create"),
    path("<int:survey_id>/", views.survey_detail, name="survey_detail"),
    path("<int:survey_id>/take/", views.take_survey, name="take_survey"),
    path("<int:survey_id>/edit/", views.survey_edit, name="survey_edit"),
    path("survey/<int:survey_id>/summary/", views.survey_summary, name="survey_summary"),
    path("<int:survey_id>/export/excel/", views.export_survey_excel, name="export_survey_excel"),
    path("<int:survey_id>/export/pdf/", views.export_survey_pdf, name="export_survey_pdf"),
    path("<int:survey_id>/delete/", views.survey_delete, name="survey_delete"),
    path("survey/<int:survey_id>/delete_responses/", views.delete_all_responses, name="delete_all_responses"),
    path("respondent/<int:respondent_id>/delete/", views.delete_respondent, name="delete_respondent"),
    path("<int:survey_id>/thanks/", views.survey_thanks, name="survey_thanks"),

    # ------- API custom endpoints -------
    path("api/openai/chat/", chat_proxy, name="api_openai_chat"),
    path("api/mobile/sync/", mobile_sync_respondent, name="mobile_sync_respondent"),

    # ------- API REST router (/api/...) -------
    path("api/", include(router.urls)),
]
