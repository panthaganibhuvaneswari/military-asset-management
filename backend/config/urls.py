from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    CustomTokenObtainPairView,
    LogoutView,
)

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [

    # -----------------------------------------
    # Django Admin
    # -----------------------------------------
    path(
        "admin/",
        admin.site.urls,
    ),

    # -----------------------------------------
    # JWT Authentication
    # -----------------------------------------
    path(
        "api/auth/login/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # -----------------------------------------
    # Swagger / OpenAPI
    # -----------------------------------------
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),

    # -----------------------------------------
    # Bases API
    # -----------------------------------------
    path(
        "api/bases/",
        include("bases.urls"),
    ),

    # -----------------------------------------
    # Equipment API
    # -----------------------------------------
    path(
        "api/equipment/",
        include("equipment.urls"),
    ),

    # -----------------------------------------
    # Purchases API
    # -----------------------------------------
    path(
        "api/",
        include("purchases.urls"),
    ),

    # -----------------------------------------
    # Transfers API
    # -----------------------------------------
    path(
        "api/",
        include("transfers.urls"),
    ),

    # -----------------------------------------
    # Assignments API
    # -----------------------------------------
    path(
        "api/",
        include("assignments.urls"),
    ),

    # -----------------------------------------
    # Expenditures API
    # -----------------------------------------
    path(
        "api/",
        include("expenditures.urls"),
    ),
    # -----------------------------------------
    # Audit Logs API
    # -----------------------------------------
    path(
        "api/audit/",
        include("audit.urls"),
    ),
    # -----------------------------------------
    # Dashboard API
    # -----------------------------------------
    path(
        "api/",
        include("dashboard.urls"),
    ),
    
]