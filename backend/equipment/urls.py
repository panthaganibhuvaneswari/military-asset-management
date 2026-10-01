from rest_framework.routers import DefaultRouter
from .views import EquipmentTypeViewSet


router = DefaultRouter()

router.register(
    r"",
    EquipmentTypeViewSet,
    basename="equipment"
)

urlpatterns = router.urls