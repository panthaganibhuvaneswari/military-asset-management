from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Purchase
from .serializers import PurchaseSerializer
from audit.utils import create_audit_log


class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Purchase.objects.select_related(
            "base",
            "equipment_type",
            "created_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "COMMANDER":
            return queryset.filter(base=user.assigned_base)

        if user.role == "LOGISTICS":
            return queryset

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "COMMANDER":
            base = serializer.validated_data["base"]

            if base != user.assigned_base:
                raise PermissionDenied(
                    "You can only create purchases for your assigned base."
                )

        purchase = serializer.save(created_by=user)

        create_audit_log(
            user=user,
            action="CREATE",
            entity="Purchase",
            entity_id=purchase.id,
            details={
                "reference_number": purchase.reference_number,
                "base": purchase.base.name,
                "equipment_type": purchase.equipment_type.name,
                "quantity": purchase.quantity,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can update purchases."
            )

        purchase = serializer.save()

        create_audit_log(
            user=user,
            action="UPDATE",
            entity="Purchase",
            entity_id=purchase.id,
            details={
                "reference_number": purchase.reference_number,
                "base": purchase.base.name,
                "equipment_type": purchase.equipment_type.name,
                "quantity": purchase.quantity,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can delete purchases."
            )

        purchase_id = instance.id
        reference_number = instance.reference_number

        instance.delete()

        create_audit_log(
            user=user,
            action="DELETE",
            entity="Purchase",
            entity_id=purchase_id,
            details={
                "reference_number": reference_number,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )