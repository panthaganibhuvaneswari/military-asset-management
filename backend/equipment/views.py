from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import EquipmentType
from .serializers import EquipmentTypeSerializer


class EquipmentTypeViewSet(viewsets.ModelViewSet):
    queryset = EquipmentType.objects.all().order_by("name")
    serializer_class = EquipmentTypeSerializer
    permission_classes = [IsAuthenticated]