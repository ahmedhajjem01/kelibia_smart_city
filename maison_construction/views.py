from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import DemandeConstruction, DemandeGoudronnage, DemandeCertificatVocation, DemandeRaccordement
from .serializers import (
    DemandeConstructionSerializer, DemandeGoudronnageSerializer, 
    DemandeCertificatVocationSerializer, DemandeRaccordementSerializer
)
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings

def notify_citizen(instance, title_prefix, link='/dashboard'):
    try:
        status_display = instance.status
        if hasattr(instance, 'get_status_display'):
            status_display = instance.get_status_display()
        
        Notification.objects.create(
            recipient=instance.citizen,
            title=f"Mise à jour: {title_prefix}",
            message=f"Le statut de votre demande '{title_prefix} #{instance.id}' a été mis à jour: {status_display}.",
            notification_type='success' if instance.status in ['permis_delivre', 'ready', 'approved', 'resolved', 'travaux_termines'] else 'info',
            link=link
        )
        
        if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
            import threading
            citizen_name = instance.citizen.first_name
            citizen_email = instance.citizen.email
            from_email = settings.DEFAULT_FROM_EMAIL
            def _send():
                try:
                    subject = f"Mise à jour: {title_prefix} - Kelibia Smart City"
                    msg = f"Bonjour {citizen_name},\n\nLe statut de votre demande de {title_prefix} a été mis à jour.\nNouveau statut : {status_display}.\n\nCordialement,\nL'équipe Kelibia Smart City"
                    send_mail(subject, msg, from_email, [citizen_email], fail_silently=True)
                except Exception as ex:
                    print(f"Background email failed for {title_prefix}: {ex}")
            threading.Thread(target=_send).start()
    except Exception as e:
        print(f"Failed to send notification for {title_prefix}: {e}")


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
        notify_citizen(demande, "Permis de Construire", link='/mes-demandes')
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


class DemandeGoudronnageViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeGoudronnageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'update_status':
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ('agent', 'supervisor') or user.is_staff or user.is_superuser:
            return DemandeGoudronnage.objects.all().select_related('citizen')
        return DemandeGoudronnage.objects.filter(citizen=user).select_related('citizen')

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        demande = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status in dict(DemandeGoudronnage.STATUS_CHOICES):
            demande.status = new_status
        if 'commentaire_agent' in request.data:
            demande.commentaire_agent = request.data['commentaire_agent']
        demande.save()
        notify_citizen(demande, "Goudronnage", link='/mes-demandes')
        return Response(DemandeGoudronnageSerializer(demande).data)


class DemandeCertificatVocationViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeCertificatVocationSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'update_status':
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ('agent', 'supervisor') or user.is_staff or user.is_superuser:
            return DemandeCertificatVocation.objects.all().select_related('citizen')
        return DemandeCertificatVocation.objects.filter(citizen=user).select_related('citizen')

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        demande = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status in dict(DemandeCertificatVocation.STATUS_CHOICES):
            demande.status = new_status
        if 'commentaire_agent' in request.data:
            demande.commentaire_agent = request.data['commentaire_agent']
        if 'certificat_signe' in request.FILES:
            demande.certificat_signe = request.FILES['certificat_signe']
        demande.save()
        notify_citizen(demande, "Certificat de Vocation", link='/mes-demandes')
        return Response(DemandeCertificatVocationSerializer(demande).data)


class DemandeRaccordementViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeRaccordementSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'update_status':
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ('agent', 'supervisor') or user.is_staff or user.is_superuser:
            return DemandeRaccordement.objects.all().select_related('citizen')
        return DemandeRaccordement.objects.filter(citizen=user).select_related('citizen')

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        demande = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status in dict(DemandeRaccordement.STATUS_CHOICES):
            demande.status = new_status
        if 'commentaire_agent' in request.data:
            demande.commentaire_agent = request.data['commentaire_agent']
        if 'date_visite' in request.data:
            demande.date_visite = request.data['date_visite']
        if 'devis_montant' in request.data:
            demande.devis_montant = request.data['devis_montant']
        if 'devis_pdf' in request.FILES:
            demande.devis_pdf = request.FILES['devis_pdf']
        demande.save()
        notify_citizen(demande, "Raccordement", link='/mes-demandes')
        return Response(DemandeRaccordementSerializer(demande).data)
