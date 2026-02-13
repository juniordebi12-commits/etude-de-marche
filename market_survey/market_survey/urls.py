from django.contrib import admin
from django.urls import path, include,re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # Auth Django
    path("", include("django.contrib.auth.urls")),
    path("accounts/", include("django.contrib.auth.urls")),

    # API
    path("api/auth/", include("accounts.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/", include("feedback.urls")),

    # Survey backend routes (Django)
    path("", include("survey.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name="index.html")),
]
