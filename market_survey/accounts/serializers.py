# accounts/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer renvoyé par /api/auth/me/
    Expose explicitement les flags admin utilisés côté frontend.
    """
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff", "is_superuser", "is_admin")

    def get_is_admin(self, obj):
        # Même logique que côté frontend
        return bool(
            getattr(obj, "is_staff", False)
            or getattr(obj, "is_superuser", False)
            or getattr(obj, "is_admin", False)
        )


class RegisterSerializer(serializers.ModelSerializer):
    """
    Simple serializer d'inscription (si tu utilises RegisterView).
    """
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", "") or "",
            password=validated_data["password"],
        )
