from rest_framework.permissions import BasePermission
from core.permissions import is_supervisor, is_agent_for_service


class IsAgentOrAdmin(BasePermission):
    """
    Forum moderation actions: only the forum_moderator agent (or staff) can use this.
    Supervisors are NOT allowed to moderate — read-only role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # staff/superuser override (e.g. Django admin)
        if request.user.is_staff or request.user.is_superuser:
            return True
        # Supervisors are observers — no moderation
        if is_supervisor(request.user):
            return False
        # Only the forum_moderator agent can moderate
        return is_agent_for_service(request.user, 'forum_moderator')
