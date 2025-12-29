# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView , EmailOrUsernameTokenView,LogoutView


urlpatterns = [
    # POST /api/auth/register/        -> create user
    path("register/", RegisterView.as_view(), name="api_register"),

    # POST /api/auth/token/           -> obtain pair (access / refresh)
    path("token/", EmailOrUsernameTokenView.as_view(), name="token_obtain_pair"),


    # POST /api/auth/token/refresh/   -> refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("logout/", LogoutView.as_view(), name="logout"),

    # GET /api/auth/me/               -> get current user (requires Bearer token)
    path("me/", MeView.as_view(), name="api_me"),
]
