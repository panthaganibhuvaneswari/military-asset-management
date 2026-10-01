from django.conf import settings
from django.db import models


class Expenditure(models.Model):

    base = models.ForeignKey(
        "bases.Base",
        on_delete=models.PROTECT,
        related_name="expenditures"
    )

    equipment_type = models.ForeignKey(
        "equipment.EquipmentType",
        on_delete=models.PROTECT,
        related_name="expenditures"
    )

    quantity = models.PositiveIntegerField()

    reason = models.TextField()

    expenditure_date = models.DateTimeField()

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_expenditures"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.equipment_type.name} - {self.quantity}"