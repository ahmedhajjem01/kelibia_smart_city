from rest_framework import viewsets, permissions
from .models import DemandeEau
from .serializers import DemandeEauSerializer


class DemandeEauViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeEauSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            return DemandeEau.objects.all()
        return DemandeEau.objects.filter(citizen=user)
