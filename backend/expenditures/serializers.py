from rest_framework import serializers
from .models import Expenditure


class ExpenditureSerializer(serializers.ModelSerializer):
    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    recorded_by_username = serializers.CharField(
        source="recorded_by.username",
        read_only=True
    )

    class Meta:
        model = Expenditure
        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "reason",
            "expenditure_date",
            "recorded_by",
            "recorded_by_username",
            "created_at",
        ]

        read_only_fields = [
            "recorded_by",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        return value