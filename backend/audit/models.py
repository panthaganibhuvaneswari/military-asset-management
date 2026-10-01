from django.conf import settings
from django.db import models


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )

    entity = models.CharField(
        max_length=100
    )

    entity_id = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    details = models.JSONField(
        default=dict,
        blank=True
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user} - {self.action} - {self.entity}"