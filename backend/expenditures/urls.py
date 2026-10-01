from rest_framework.routers import DefaultRouter
from .views import ExpenditureViewSet


router = DefaultRouter()

router.register(
    "expenditures",
    ExpenditureViewSet,
    basename="expenditure"
)

urlpatterns = router.urls