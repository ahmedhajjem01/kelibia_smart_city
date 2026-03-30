from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeLivretFamille
from .serializers import DemandeLivretFamilleSerializer, DemandeLivretFamilleAgentSerializer

from django.db.models import Q

class DemandeLivretFamilleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamille.objects.all().order_by('-created_at')
        
        # Le livret de famille doit être visible au citoyen qui l'a demandé, 
        # mais aussi aux conjoints s'ils ont un compte connecté via leur CIN.
        return DemandeLivretFamille.objects.filter(
            Q(citizen=user) | 
            Q(cin_epoux=getattr(user, 'cin', '')) | 
            Q(cin_epouse=getattr(user, 'cin', ''))
        ).order_by('-created_at')
    def get_serializer_class(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamilleAgentSerializer
        return DemandeLivretFamilleSerializer
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
