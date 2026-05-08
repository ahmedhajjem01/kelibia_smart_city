from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeEau
from .serializers import DemandeEauSerializer
from core.permissions import is_supervisor, is_agent, is_agent_for_service


class DemandeEauViewSet(viewsets.ModelViewSet):
    """
    Access rules:
    - citizen: sees only their own requests
    - agent (water): sees all requests; can update
    - supervisor: read-only; sees all requests (monitoring)
    """
    serializer_class = DemandeEauSerializer
    permission_classes = [permissions.IsAuthenticated]
    REQUIRED_SERVICE = 'water'

    def get_queryset(self):
        user = self.request.user
        if is_supervisor(user):
            return DemandeEau.objects.all()
        if is_agent(user):
            if is_agent_for_service(user, self.REQUIRED_SERVICE):
                return DemandeEau.objects.all()
            return DemandeEau.objects.none()
        return DemandeEau.objects.filter(citizen=user)

    def update(self, request, *args, **kwargs):
        user = request.user
        if is_supervisor(user):
            return Response(
                {"error": "Les superviseurs ne peuvent pas modifier les demandes. Role: observateur uniquement."},
                status=status.HTTP_403_FORBIDDEN
            )
        if not is_agent_for_service(user, self.REQUIRED_SERVICE):
            return Response(
                {"error": "Acces refuse. Vous n'etes pas responsable du service Eau & Assainissement."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
