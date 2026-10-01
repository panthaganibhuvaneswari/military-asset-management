from django.contrib import admin
from .models import Expenditure


@admin.register(Expenditure)
class ExpenditureAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "base",
        "equipment_type",
        "quantity",
        "reason",
        "expenditure_date",
        "recorded_by",
    )

    list_filter = (
        "base",
        "equipment_type",
        "expenditure_date",
    )

    search_fields = (
        "base__name",
        "equipment_type__name",
        "reason",
    )

    ordering = ("-expenditure_date",)