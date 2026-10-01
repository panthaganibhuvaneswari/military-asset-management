from rest_framework.routers import DefaultRouter
from .views import TransferViewSet


router = DefaultRouter()

router.register(
    "transfers",
    TransferViewSet,
    basename="transfer"
)

urlpatterns = router.urls