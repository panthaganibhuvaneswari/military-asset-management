from django.contrib import admin
from .models import EquipmentType


@admin.register(EquipmentType)
class EquipmentTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("name",)