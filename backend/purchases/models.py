from django.conf import settings
from django.db import models


class Purchase(models.Model):
    base = models.ForeignKey(
        "bases.Base",
        on_delete=models.PROTECT,
        related_name="purchases"
    )

    equipment_type = models.ForeignKey(
        "equipment.EquipmentType",
        on_delete=models.PROTECT,
        related_name="purchases"
    )

    quantity = models.PositiveIntegerField()

    purchase_date = models.DateField()

    reference_number = models.CharField(
        max_length=100,
        unique=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_purchases"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference_number} - {self.equipment_type.name}"