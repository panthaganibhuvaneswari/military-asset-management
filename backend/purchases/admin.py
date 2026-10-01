from django.contrib import admin
from .models import Purchase


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reference_number",
        "base",
        "equipment_type",
        "quantity",
        "purchase_date",
        "created_by",
    )

    list_filter = (
        "base",
        "equipment_type",
        "purchase_date",
    )

    search_fields = (
        "reference_number",
        "base__name",
        "equipment_type__name",
    )

    ordering = ("-purchase_date",)