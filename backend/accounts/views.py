from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from audit.utils import create_audit_log

from .serializers import CustomTokenObtainPairSerializer


User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "detail": "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)

            user_id = token["user_id"]
            user = User.objects.get(id=user_id)

            # Blacklist refresh token
            token.blacklist()

            # Create logout audit log
            create_audit_log(
                user=user,
                action="LOGOUT",
                entity="User",
                entity_id=user.id,
                details={
                    "username": user.username,
                },
                ip_address=request.META.get("REMOTE_ADDR"),
            )

            return Response(
                {
                    "detail": "Logout successful."
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {
                    "detail": "User not found."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:
            return Response(
                {
                    "detail": "Invalid or expired refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )