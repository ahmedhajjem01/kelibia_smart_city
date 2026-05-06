from django.shortcuts import get_object_or_404, render
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.models import Citoyen
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeMariage, ExtraitMariage
from .serializers import DemandeMariageSerializer, ExtraitMariageSerializer

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
