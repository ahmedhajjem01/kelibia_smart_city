from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeMariage, ExtraitMariage
from .serializers import DemandeMariageSerializer, ExtraitMariageSerializer

class ExtraitMariageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExtraitMariageSerializer

    def get_queryset(self):
        user = self.request.user
        # L'acte est visible si l'utilisateur est soit l'époux, soit l'épouse (via CIN)
        # Ou si l'acte est explicitement lié à son compte
        return ExtraitMariage.objects.filter(
            Q(user=user) | 
            Q(epoux__cin=user.cin) | 
            Q(epouse__cin=user.cin)
        ).distinct()

class DemandeMariageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DemandeMariageSerializer

    def get_queryset(self):
        user = self.request.user
        # La demande est visible par le demandeur initial OU par l'un des deux époux via CIN
        return DemandeMariage.objects.filter(
            Q(citizen=user) | 
            Q(cin_epoux=user.cin) | 
            Q(cin_epouse=user.cin)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
