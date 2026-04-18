from rest_framework import viewsets, permissions
from .models import DemandeCommerce
from .serializers import DemandeCommerceSerializer


class DemandeCommerceViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeCommerceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            return DemandeCommerce.objects.all()
        return DemandeCommerce.objects.filter(citizen=user)
