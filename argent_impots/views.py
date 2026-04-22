from rest_framework import viewsets, permissions
from .models import DemandeImpot
from .serializers import DemandeImpotSerializer


class DemandeImpotViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeImpotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            return DemandeImpot.objects.all()
        return DemandeImpot.objects.filter(citizen=user)
