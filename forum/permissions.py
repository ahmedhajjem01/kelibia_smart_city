from rest_framework.permissions import BasePermission


class IsAgentOrAdmin(BasePermission):
    """Only agents and admins can use this action."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.user_type == 'agent' or request.user.is_staff)
        )
