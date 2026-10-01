from django.conf import settings
from django.db import models


class Transfer(models.Model):

    STATUS_CHOICES = [
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    from_base = models.ForeignKey(
        "bases.Base",
        on_delete=models.PROTECT,
        related_name="outgoing_transfers"
    )

    to_base = models.ForeignKey(
        "bases.Base",
        on_delete=models.PROTECT,
        related_name="incoming_transfers"
    )

    equipment_type = models.ForeignKey(
        "equipment.EquipmentType",
        on_delete=models.PROTECT,
        related_name="transfers"
    )

    quantity = models.PositiveIntegerField()

    transfer_date = models.DateTimeField()

    reference_number = models.CharField(
        max_length=100,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="COMPLETED"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_transfers"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference_number} - {self.from_base} to {self.to_base}"