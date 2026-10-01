from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Base
from .serializers import BaseSerializer


class BaseViewSet(viewsets.ModelViewSet):
    queryset = Base.objects.all().order_by("name")
    serializer_class = BaseSerializer
    permission_classes = [IsAuthenticated]