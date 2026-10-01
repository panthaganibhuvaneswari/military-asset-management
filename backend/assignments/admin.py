from django.contrib import admin
from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "base",
        "equipment_type",
        "personnel_name",
        "quantity",
        "assigned_date",
        "assigned_by",
    )

    list_filter = (
        "base",
        "equipment_type",
        "assigned_date",
    )

    search_fields = (
        "personnel_name",
        "equipment_type__name",
        "base__name",
    )

    ordering = ("-assigned_date",)