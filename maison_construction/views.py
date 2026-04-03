from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import DemandeConstruction
from .serializers import DemandeConstructionSerializer


class IsAgentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type in ('agent', 'supervisor') or
            request.user.is_staff or
            request.user.is_superuser
        )


class DemandeConstructionViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeConstructionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['update_status', 'stats', 'high_risk']:
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ('agent', 'supervisor') or user.is_staff or user.is_superuser:
            return DemandeConstruction.objects.all().select_related('citizen')
        return DemandeConstruction.objects.filter(citizen=user).select_related('citizen')

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        demande = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status in dict(DemandeConstruction.STATUS_CHOICES):
            demande.status = new_status
        if 'priorite' in request.data:
            demande.priorite = request.data['priorite']
        if 'commentaire_agent' in request.data:
            demande.commentaire_agent = request.data['commentaire_agent']
        if 'permis_signe' in request.FILES:
            demande.permis_signe = request.FILES['permis_signe']
        if 'is_paid' in request.data:
            demande.is_paid = request.data['is_paid'] in [True, 'true', '1']
        demande.save()
        return Response(DemandeConstructionSerializer(demande).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        qs = DemandeConstruction.objects.all()
        return Response({
            'total': qs.count(),
            'pending': qs.filter(status='pending').count(),
            'en_cours': qs.filter(status='en_cours_instruction').count(),
            'permis_delivre': qs.filter(status='permis_delivre').count(),
            'rejet': qs.filter(status='rejet_definitif').count(),
            'high_risk': qs.filter(is_high_risk=True).count(),
        })

    @action(detail=False, methods=['get'], url_path='high-risk')
    def high_risk(self, request):
        qs = DemandeConstruction.objects.filter(is_high_risk=True).select_related('citizen')
        return Response(DemandeConstructionSerializer(qs, many=True).data)
