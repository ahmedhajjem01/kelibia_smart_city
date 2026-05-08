from django.shortcuts import get_object_or_404, render
from rest_framework_simplejwt.authentication import JWTAuthentication
from extrait_naissance.models import Citoyen
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeMariage, ExtraitMariage
from .serializers import DemandeMariageSerializer, ExtraitMariageSerializer
from core.permissions import is_supervisor, is_agent, is_agent_for_service

CIVIL_SERVICE = 'civil_registry'

def certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitMariage, pk=pk)
    
    # Simplified check for PFE defense
    is_valid = extrait.is_paid
            
    token = request.GET.get('token')
    if not is_valid and token:
        try:
            jwt_authenticator = JWTAuthentication()
            validated_token = jwt_authenticator.get_validated_token(token)
            user = jwt_authenticator.get_user(validated_token)
            
            # ASD Active bypasses payment
            if getattr(user, 'has_active_asd', False):
                is_valid = True
            
        except Exception: 
            pass

    if not is_valid:
        return render(request, 'errors/unpaid.html', {'extrait': extrait})
        
    if lang == 'fr':
        template = 'extrait_mariage/certificate_fr.html'
    else:
        template = 'extrait_mariage/certificate.html'
    return render(request, template, {'extrait': extrait})

class ExtraitMariageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExtraitMariageSerializer

    def get_queryset(self):
        user = self.request.user
        if is_supervisor(user):
            return ExtraitMariage.objects.all()
        if is_agent(user):
            if is_agent_for_service(user, CIVIL_SERVICE):
                return ExtraitMariage.objects.all()
            return ExtraitMariage.objects.none()
        # Citizens see their own or spouse's marriage certificates
        return ExtraitMariage.objects.filter(
            Q(user=user) |
            Q(epoux__cin=getattr(user, 'cin', '')) |
            Q(epouse__cin=getattr(user, 'cin', ''))
        ).distinct()


class DemandeMariageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DemandeMariageSerializer

    def get_queryset(self):
        user = self.request.user
        if is_supervisor(user):
            return DemandeMariage.objects.all()
        if is_agent(user):
            if is_agent_for_service(user, CIVIL_SERVICE):
                return DemandeMariage.objects.filter(is_paid=True)
            return DemandeMariage.objects.none()
        # Citizens see their own or spouse's requests
        return DemandeMariage.objects.filter(
            Q(citizen=user) |
            Q(cin_epoux=getattr(user, 'cin', '')) |
            Q(cin_epouse=getattr(user, 'cin', ''))
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    def update(self, request, *args, **kwargs):
        user = request.user
        if is_supervisor(user):
            return Response(
                {"error": "Les superviseurs ne peuvent pas modifier les demandes. Rôle: observateur uniquement."},
                status=status.HTTP_403_FORBIDDEN
            )
        if not is_agent_for_service(user, CIVIL_SERVICE):
            return Response(
                {"error": "Accès refusé. Vous n'êtes pas responsable du service État Civil."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
