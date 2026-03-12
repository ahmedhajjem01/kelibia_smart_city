from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Reclamation
from .serializers import ReclamationSerializer

class ReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationSerializer
    queryset = Reclamation.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Only agents or admins can update status or other fields
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.user_type == 'agent':
            return Reclamation.objects.all()
        # Citizens only see their own reclamations
        return Reclamation.objects.filter(citizen=user)

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        reclamation = self.get_object()
        user = request.user

        # Only admins or agents can change status
        if not (user.is_staff or user.is_superuser or user.user_type == 'agent'):
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status in dict(Reclamation.STATUS_CHOICES):
            reclamation.status = new_status
            if user.user_type == 'agent':
                reclamation.agent = user
            reclamation.save()
            return Response({"status": "Statut mis à jour."})
        
        return Response({"detail": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)
