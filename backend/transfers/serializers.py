from rest_framework import serializers
from .models import Transfer


class TransferSerializer(serializers.ModelSerializer):
    from_base_name = serializers.CharField(
        source="from_base.name",
        read_only=True
    )
    to_base_name = serializers.CharField(
        source="to_base.name",
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
        model = Transfer
        fields = [
            "id",
            "from_base",
            "from_base_name",
            "to_base",
            "to_base_name",
            "equipment_type",
            "equipment_name",
            "quantity",
            "transfer_date",
            "reference_number",
            "status",
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

    def validate(self, data):
        if data["from_base"] == data["to_base"]:
            raise serializers.ValidationError(
                "Source and destination bases must be different."
            )

        return data
    