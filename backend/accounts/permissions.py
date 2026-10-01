from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to Admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsAdminOrCommander(BasePermission):
    """
    Allows Admin and Base Commander users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "COMMANDER"]
        )


class IsAdminCommanderOrLogistics(BasePermission):
    """
    Allows Admin, Base Commander and Logistics Officer users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                "ADMIN",
                "COMMANDER",
                "LOGISTICS",
            ]
        )


class IsLogisticsOrAdmin(BasePermission):
    """
    Allows Admin and Logistics Officer users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                "ADMIN",
                "LOGISTICS",
            ]
        )