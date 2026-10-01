from django.db import models


class EquipmentType(models.Model):

    CATEGORY_CHOICES = [
        ("VEHICLE", "Vehicle"),
        ("WEAPON", "Weapon"),
        ("AMMUNITION", "Ammunition"),
        ("COMMUNICATION", "Communication Equipment"),
        ("OTHER", "Other"),
    ]

    name = models.CharField(max_length=100, unique=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES
    )

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name