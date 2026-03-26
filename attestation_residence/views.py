from rest_framework import viewsets, permissions
from .models import DemandeResidence
from .serializers import DemandeResidenceSerializer

class DemandeResidenceViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeResidenceSerializer
    queryset = DemandeResidence.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.user_type == 'agent':
            return DemandeResidence.objects.all()
        return DemandeResidence.objects.filter(citizen=user)
