from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DemandeResidence
from .serializers import DemandeResidenceSerializer
from core.permissions import is_supervisor, is_agent_for_service, is_agent


class DemandeResidenceViewSet(viewsets.ModelViewSet):
    """
    Access rules:
    • citizen      — sees only their own requests
    • agent        — must be assigned to 'residence' service; sees all paid requests
    • supervisor   — read-only; sees all requests (monitoring)
    """
    serializer_class = DemandeResidenceSerializer
    queryset = DemandeResidence.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    # Service key that an agent must have to access residence requests
    REQUIRED_SERVICE = 'residence'

    def get_queryset(self):
        user = self.request.user

        if is_supervisor(user):
            # Supervisors see everything — monitoring role
            return DemandeResidence.objects.all()

        if is_agent(user):
            # Only the residence agent can process these requests
            if is_agent_for_service(user, self.REQUIRED_SERVICE):
                return DemandeResidence.objects.filter(is_paid=True)
            return DemandeResidence.objects.none()

        # Citizens see only their own requests
        return DemandeResidence.objects.filter(citizen=user)

    def update(self, request, *args, **kwargs):
        """Only residence agents can update; supervisors are read-only."""
        user = request.user
        if is_supervisor(user):
            return Response(
                {"error": "Les superviseurs ne peuvent pas modifier les demandes. Rôle: observateur uniquement."},
                status=status.HTTP_403_FORBIDDEN
            )
        if not is_agent_for_service(user, self.REQUIRED_SERVICE):
            return Response(
                {"error": "Accès refusé. Vous n'êtes pas responsable du service Résidence."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
