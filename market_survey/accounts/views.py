# accounts/views.py
from rest_framework import generics, permissions
from .serializers import UserSerializer, RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework.response import Response

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint d'inscription:
    POST /api/auth/register/
    body: { "username": "...", "password": "...", "email": "..." }
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveAPIView):
    """
    GET /api/auth/me/  (nécessite un JWT valide)

    IMPORTANT:
    - Nous évitons d'importer billing.models au niveau module (pour éviter
      les problèmes d'ordre d'import / INSTALLED_APPS). On importe localement
      dans la méthode get().
    - On renvoie aussi un flag 'is_admin' pour faciliter la détection côté frontend.
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        user = request.user

        # import localement pour éviter les erreurs si billing n'est pas encore dans INSTALLED_APPS
        BillingAccount = None
        try:
            from billing.models import BillingAccount  # import local
            BillingAccount = BillingAccount
        except Exception:
            # si l'import échoue (app non installée ou erreur), on continue sans billing
            BillingAccount = None

        billing = None
        if BillingAccount:
            try:
                billing = BillingAccount.objects.get(user=user)
            except BillingAccount.DoesNotExist:
                billing = None
            except Exception:
                billing = None

        # construire la réponse (champ is_admin pour le frontend)
        is_admin_flag = bool(
            getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
            or getattr(user, "is_admin", False)
        )

        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email or "",
            "is_staff": bool(user.is_staff),
            "is_superuser": bool(user.is_superuser),
            "is_admin": is_admin_flag,
            "plan": billing.plan if billing else "free",
            "credits_balance": billing.balance if billing else 0,
        }
        return Response(data)
