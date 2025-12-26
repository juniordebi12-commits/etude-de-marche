# market_survey/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # expose the standard Django auth views (login/logout/password change)
    # This makes reverse('logout') and {% url 'logout' %} work.
    path("", include("django.contrib.auth.urls")),
    path("accounts/", include("django.contrib.auth.urls")),

    # If you also have an accounts app exposing API endpoints (register/me/token),
    # keep it under api/auth/ (no change).
    path("api/auth/", include("accounts.urls")),

    path("api/billing/", include("billing.urls")),


    # Survey app (routes UI + API defined in survey/urls.py)
    path("", include("survey.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
