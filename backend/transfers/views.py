from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import Transfer
from .serializers import TransferSerializer
from purchases.models import Purchase
from expenditures.models import Expenditure
from audit.utils import create_audit_log


class TransferViewSet(viewsets.ModelViewSet):
    serializer_class = TransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Transfer.objects.select_related(
            "from_base",
            "to_base",
            "equipment_type",
            "created_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "COMMANDER":
            return queryset.filter(
                from_base=user.assigned_base
            ) | queryset.filter(
                to_base=user.assigned_base
            )

        if user.role == "LOGISTICS":
            return queryset

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        from_base = serializer.validated_data["from_base"]
        to_base = serializer.validated_data["to_base"]
        equipment_type = serializer.validated_data["equipment_type"]
        quantity = serializer.validated_data["quantity"]

        if user.role == "COMMANDER":
            if (
                from_base != user.assigned_base
                and to_base != user.assigned_base
            ):
                raise PermissionDenied(
                    "You can only create transfers involving your assigned base."
                )

        with transaction.atomic():

            purchases = Purchase.objects.filter(
                base=from_base,
                equipment_type=equipment_type
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            incoming = Transfer.objects.filter(
                to_base=from_base,
                equipment_type=equipment_type,
                status="COMPLETED"
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            outgoing = Transfer.objects.filter(
                from_base=from_base,
                equipment_type=equipment_type,
                status="COMPLETED"
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            expended = Expenditure.objects.filter(
                base=from_base,
                equipment_type=equipment_type
            ).aggregate(
                total=Sum("quantity")
            )["total"] or 0

            available_quantity = (
                purchases
                + incoming
                - outgoing
                - expended
            )

            if quantity > available_quantity:
                raise ValidationError({
                    "quantity": (
                        f"Insufficient stock. "
                        f"Available quantity at {from_base.name}: "
                        f"{available_quantity}"
                    )
                })

            transfer = serializer.save(created_by=user)

            create_audit_log(
                user=user,
                action="CREATE",
                entity="Transfer",
                entity_id=transfer.id,
                details={
                    "reference_number": transfer.reference_number,
                    "from_base": transfer.from_base.name,
                    "to_base": transfer.to_base.name,
                    "equipment_type": transfer.equipment_type.name,
                    "quantity": transfer.quantity,
                    "status": transfer.status,
                },
                ip_address=self.request.META.get("REMOTE_ADDR"),
            )

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can update transfers."
            )

        transfer = serializer.save()

        create_audit_log(
            user=user,
            action="UPDATE",
            entity="Transfer",
            entity_id=transfer.id,
            details={
                "reference_number": transfer.reference_number,
                "from_base": transfer.from_base.name,
                "to_base": transfer.to_base.name,
                "equipment_type": transfer.equipment_type.name,
                "quantity": transfer.quantity,
                "status": transfer.status,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can delete transfers."
            )

        transfer_id = instance.id
        reference_number = instance.reference_number

        instance.delete()

        create_audit_log(
            user=user,
            action="DELETE",
            entity="Transfer",
            entity_id=transfer_id,
            details={
                "reference_number": reference_number,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )