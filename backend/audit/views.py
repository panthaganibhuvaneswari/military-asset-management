from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):

    queryset = AuditLog.objects.select_related(
        "user"
    ).all().order_by("-timestamp")

    serializer_class = AuditLogSerializer

    permission_classes = [
        IsAuthenticated
    ]