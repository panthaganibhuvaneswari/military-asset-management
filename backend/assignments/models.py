from django.conf import settings
from django.db import models


class Assignment(models.Model):

    base = models.ForeignKey(
        "bases.Base",
        on_delete=models.PROTECT,
        related_name="assignments"
    )

    equipment_type = models.ForeignKey(
        "equipment.EquipmentType",
        on_delete=models.PROTECT,
        related_name="assignments"
    )

    personnel_name = models.CharField(
        max_length=150
    )

    quantity = models.PositiveIntegerField()

    assigned_date = models.DateTimeField()

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_assignments"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.equipment_type.name} assigned to {self.personnel_name}"