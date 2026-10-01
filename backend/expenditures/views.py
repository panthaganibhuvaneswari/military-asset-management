from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Expenditure
from .serializers import ExpenditureSerializer
from purchases.models import Purchase
from transfers.models import Transfer
from audit.utils import create_audit_log


class ExpenditureViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenditureSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Expenditure.objects.select_related(
            "base",
            "equipment_type",
            "recorded_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "COMMANDER":
            return queryset.filter(base=user.assigned_base)

        # Logistics officers cannot access expenditures
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["ADMIN", "COMMANDER"]:
            raise PermissionDenied(
                "Only Admin or Base Commander can record expenditures."
            )

        base = serializer.validated_data["base"]
        equipment_type = serializer.validated_data["equipment_type"]
        quantity = serializer.validated_data["quantity"]

        if user.role == "COMMANDER":
            if base != user.assigned_base:
                raise PermissionDenied(
                    "You can only record expenditures for your assigned base."
                )

        with transaction.atomic():

            purchases = Purchase.objects.filter(
                base=base,
                equipment_type=equipment_type
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            incoming = Transfer.objects.filter(
                to_base=base,
                equipment_type=equipment_type,
                status="COMPLETED"
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            outgoing = Transfer.objects.filter(
                from_base=base,
                equipment_type=equipment_type,
                status="COMPLETED"
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            previous_expenditures = Expenditure.objects.filter(
                base=base,
                equipment_type=equipment_type
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            available_quantity = (
                purchases
                + incoming
                - outgoing
                - previous_expenditures
            )

            if quantity > available_quantity:
                raise ValidationError({
                    "quantity": (
                        f"Insufficient stock. "
                        f"Available quantity at {base.name}: "
                        f"{available_quantity}"
                    )
                })

            expenditure = serializer.save(recorded_by=user)

            create_audit_log(
                user=user,
                action="CREATE",
                entity="Expenditure",
                entity_id=expenditure.id,
                details={
                    "base": expenditure.base.name,
                    "equipment_type": expenditure.equipment_type.name,
                    "quantity": expenditure.quantity,
                    "reason": expenditure.reason,
                },
                ip_address=self.request.META.get("REMOTE_ADDR"),
            )

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can update expenditures."
            )

        expenditure = serializer.save()

        create_audit_log(
            user=user,
            action="UPDATE",
            entity="Expenditure",
            entity_id=expenditure.id,
            details={
                "base": expenditure.base.name,
                "equipment_type": expenditure.equipment_type.name,
                "quantity": expenditure.quantity,
                "reason": expenditure.reason,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can delete expenditures."
            )

        expenditure_id = instance.id
        quantity = instance.quantity

        instance.delete()

        create_audit_log(
            user=user,
            action="DELETE",
            entity="Expenditure",
            entity_id=expenditure_id,
            details={
                "quantity": quantity,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )