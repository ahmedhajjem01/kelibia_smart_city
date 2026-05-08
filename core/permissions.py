"""
Shared RBAC permission helpers for Kelibia Smart City.

Role summary:
  citizen    — can only view/create their own data
  agent      — operational actor; assigned to ONE service; sees only their service's data
  supervisor — monitoring/checking role; read-only access to everything; no operational actions

Usage in any view:
    from core.permissions import (
        is_supervisor, is_agent, is_agent_for_service,
        agent_queryset_filter, IsAgentForService, IsSupervisorReadOnly,
    )
"""

from rest_framework import permissions


# ─── helpers ────────────────────────────────────────────────────────────────

def is_supervisor(user):
    """Return True if the user is a supervisor (monitoring role)."""
    return (
        getattr(user, 'user_type', '') == 'supervisor'
        or user.is_superuser
        or user.is_staff
    )


def is_agent(user):
    """Return True if the user is an agent (any service)."""
    return getattr(user, 'user_type', '') == 'agent'


def is_agent_for_service(user, service_key):
    """Return True if the agent is assigned to the given service key."""
    return is_agent(user) and getattr(user, 'assigned_service', None) == service_key


def agent_queryset_filter(queryset, user, field='category'):
    """
    Standard filter used by agents to scope their queryset to their assigned service.
    field: the model field that maps to the agent's assigned_service key.
    Returns full queryset for supervisors, service-scoped for agents, empty otherwise.
    """
    if is_supervisor(user):
        return queryset.all()
    if is_agent(user):
        service = getattr(user, 'assigned_service', None)
        if service:
            return queryset.filter(**{field: service})
        return queryset.none()
    return queryset.none()


# ─── permission classes ──────────────────────────────────────────────────────

class IsAgentOrSupervisor(permissions.BasePermission):
    """Allow any authenticated agent or supervisor. Citizens are denied."""

    def has_permission(self, request, view):
        user = request.user
        return request.user.is_authenticated and (
            is_agent(user) or is_supervisor(user)
        )


class IsAgentForService(permissions.BasePermission):
    """
    Allow agents whose assigned_service matches `view.required_service`.
    Supervisors are always allowed (read-only monitoring).
    Set `required_service` on the ViewSet or use `get_required_service()`.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if is_supervisor(user):
            return True  # Supervisors can always view
        if not is_agent(user):
            return False
        required = getattr(view, 'required_service', None)
        if required is None:
            return True  # No restriction configured
        return getattr(user, 'assigned_service', None) == required


class IsSupervisorReadOnly(permissions.BasePermission):
    """
    Supervisors get read-only access (GET/HEAD/OPTIONS).
    Write operations (POST/PUT/PATCH/DELETE) are blocked for supervisors.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if is_supervisor(user):
            return request.method in permissions.SAFE_METHODS
        return True  # Non-supervisors handled by other permission classes
