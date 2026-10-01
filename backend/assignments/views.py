from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Assignment
from .serializers import AssignmentSerializer
from audit.utils import create_audit_log


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Assignment.objects.select_related(
            "base",
            "equipment_type",
            "assigned_by"
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "COMMANDER":
            return queryset.filter(base=user.assigned_base)

        # Logistics officers cannot access assignments
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["ADMIN", "COMMANDER"]:
            raise PermissionDenied(
                "Only Admin or Base Commander can create assignments."
            )

        base = serializer.validated_data["base"]

        if user.role == "COMMANDER":
            if base != user.assigned_base:
                raise PermissionDenied(
                    "You can only create assignments for your assigned base."
                )

        assignment = serializer.save(assigned_by=user)

        create_audit_log(
            user=user,
            action="CREATE",
            entity="Assignment",
            entity_id=assignment.id,
            details={
                "base": assignment.base.name,
                "equipment_type": assignment.equipment_type.name,
                "personnel_name": assignment.personnel_name,
                "quantity": assignment.quantity,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can update assignments."
            )

        assignment = serializer.save()

        create_audit_log(
            user=user,
            action="UPDATE",
            entity="Assignment",
            entity_id=assignment.id,
            details={
                "base": assignment.base.name,
                "equipment_type": assignment.equipment_type.name,
                "personnel_name": assignment.personnel_name,
                "quantity": assignment.quantity,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "ADMIN":
            raise PermissionDenied(
                "Only Admin users can delete assignments."
            )

        assignment_id = instance.id
        personnel_name = instance.personnel_name

        instance.delete()

        create_audit_log(
            user=user,
            action="DELETE",
            entity="Assignment",
            entity_id=assignment_id,
            details={
                "personnel_name": personnel_name,
            },
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )