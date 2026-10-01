from rest_framework import serializers

from .models import Purchase


class PurchaseSerializer(serializers.ModelSerializer):

    base_name = serializers.CharField(
        source="base.name",
        read_only=True
    )

    equipment_name = serializers.CharField(
        source="equipment_type.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Purchase

        fields = [
            "id",
            "base",
            "base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "purchase_date",
            "reference_number",
            "created_by",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = [
            "created_by",
            "created_at",
        ]

    def validate_quantity(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        return value