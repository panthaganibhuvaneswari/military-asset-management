from django.contrib import admin
from .models import Base


@admin.register(Base)
class BaseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "created_at")
    search_fields = ("name", "location")