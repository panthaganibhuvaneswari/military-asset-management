from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from audit.utils import create_audit_log


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user

        request = self.context.get("request")

        ip_address = None

        if request:
            ip_address = request.META.get("REMOTE_ADDR")

        # Create audit log
        create_audit_log(
            user=user,
            action="LOGIN",
            entity="User",
            entity_id=user.id,
            details={
                "username": user.username,
            },
            ip_address=ip_address,
        )

        # Get role safely
        role = getattr(user, "role", None)

        # Get assigned base ID
        base_id = getattr(user, "assigned_base_id", None)

        # Return user information
        data["user"] = {
            "id": user.id,
            "username": user.username,
            "role": role,
            "base_id": base_id,
        }

        return data