from rest_framework import serializers
from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    assigned_by_username = serializers.CharField(
        source="assigned_by.username",
        read_only=True
    )

    class Meta:
        model = Assignment
        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "personnel_name",
            "quantity",
            "assigned_date",
            "assigned_by",
            "assigned_by_username",
            "created_at",
        ]

        read_only_fields = [
            "assigned_by",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        return value