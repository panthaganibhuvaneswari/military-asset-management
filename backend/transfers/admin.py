from django.contrib import admin
from .models import Transfer


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reference_number",
        "from_base",
        "to_base",
        "equipment_type",
        "quantity",
        "transfer_date",
        "status",
        "created_by",
    )

    list_filter = (
        "from_base",
        "to_base",
        "equipment_type",
        "status",
        "transfer_date",
    )

    search_fields = (
        "reference_number",
        "from_base__name",
        "to_base__name",
        "equipment_type__name",
    )

    ordering = ("-transfer_date",)