from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = AuditLog

        fields = [
            "id",
            "user",
            "username",
            "action",
            "entity",
            "entity_id",
            "details",
            "ip_address",
            "timestamp",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "timestamp",
        ]