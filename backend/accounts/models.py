from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("COMMANDER", "Base Commander"),
        ("LOGISTICS", "Logistics Officer"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="LOGISTICS"
    )

    assigned_base = models.ForeignKey(
        "bases.Base",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    def __str__(self):
        return self.username