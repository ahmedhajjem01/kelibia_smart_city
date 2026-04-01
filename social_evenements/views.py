from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import DemandeEvenement
from .serializers import DemandeEvenementSerializer, DemandeEvenementPublicSerializer


class DemandeEvenementViewSet(viewsets.ModelViewSet):
    """
    CRUD for event authorization requests.
    - Citizens: see only their own requests.
    - Agents/supervisors: see all requests.
    """
    serializer_class = DemandeEvenementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            return DemandeEvenement.objects.select_related('citizen', 'conflict_with').all()
        return DemandeEvenement.objects.select_related('conflict_with').filter(citizen=user)

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Agent: update status, comment, upload signed autorisation, mark paid."""
        demande = self.get_object()
        new_status = request.data.get('status')
        commentaire = request.data.get('commentaire_agent', '')
        autorisation = request.FILES.get('autorisation_signee')
        is_paid = request.data.get('is_paid')

        allowed = [s[0] for s in DemandeEvenement.STATUS_CHOICES]
        if new_status and new_status not in allowed:
            return Response({'error': f'Statut invalide. Valeurs: {allowed}'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status:
            demande.status = new_status
        if commentaire:
            demande.commentaire_agent = commentaire
        if autorisation:
            demande.autorisation_signee = autorisation
        if is_paid is not None:
            demande.is_paid = str(is_paid).lower() in ('true', '1', 'yes')

        # Re-run conflict detection on approval
        if new_status == 'approved':
            demande.detect_conflict()

        demande.save()
        return Response(self.get_serializer(demande).data)

    @action(detail=False, methods=['get'], url_path='conflicts', permission_classes=[permissions.IsAuthenticated])
    def list_conflicts(self, request):
        """Agent: list all requests that have a conflict detected."""
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor')):
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        qs = DemandeEvenement.objects.filter(has_conflict=True).select_related('conflict_with')
        return Response(self.get_serializer(qs, many=True).data)


class EvenementsPublicsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public listing of APPROVED events — accessible without authentication.
    Supports filtering by type, date range.
    """
    serializer_class = DemandeEvenementPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = DemandeEvenement.objects.filter(status='approved').order_by('date_debut')

        type_ev = self.request.query_params.get('type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        lieu = self.request.query_params.get('lieu')
        search = self.request.query_params.get('search')

        if type_ev:
            qs = qs.filter(type_evenement=type_ev)
        if date_from:
            qs = qs.filter(date_debut__gte=date_from)
        if date_to:
            qs = qs.filter(date_fin__lte=date_to)
        if lieu:
            qs = qs.filter(lieu_type=lieu)
        if search:
            qs = qs.filter(
                Q(titre_evenement__icontains=search) |
                Q(description__icontains=search) |
                Q(nom_organisateur__icontains=search)
            )
        return qs
