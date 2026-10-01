from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "action",
        "entity",
        "entity_id",
        "timestamp",
        "ip_address",
    )

    list_filter = (
        "action",
        "entity",
        "timestamp",
    )

    search_fields = (
        "entity",
        "user__username",
        "ip_address",
    )

    ordering = ("-timestamp",)

    readonly_fields = (
        "user",
        "action",
        "entity",
        "entity_id",
        "details",
        "ip_address",
        "timestamp",
    )