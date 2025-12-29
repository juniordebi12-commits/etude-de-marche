# accounts/serializers.py
from django.contrib.auth import get_user_model,authenticate
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
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Un compte avec cet email existe déjà."
            )
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
class EmailOrUsernameTokenSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get("username")
        password = data.get("password")

        # si c'est un email, on récupère le username associé
        if "@" in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                identifier = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Identifiants invalides")

        user = authenticate(username=identifier, password=password)

        if not user:
            raise serializers.ValidationError("Identifiants invalides")

        data["user"] = user
        return data