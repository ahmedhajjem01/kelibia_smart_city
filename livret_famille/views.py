from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeLivretFamille
from .serializers import DemandeLivretFamilleSerializer, DemandeLivretFamilleAgentSerializer
from core.permissions import is_supervisor, is_agent, is_agent_for_service

from django.db.models import Q
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings

class DemandeLivretFamilleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    REQUIRED_SERVICE = 'civil_registry'

    def get_queryset(self):
        user = self.request.user

        if is_supervisor(user):
            return DemandeLivretFamille.objects.all().order_by('-created_at')

        if is_agent(user):
            if is_agent_for_service(user, self.REQUIRED_SERVICE):
                return DemandeLivretFamille.objects.filter(is_paid=True).order_by('-created_at')
            return DemandeLivretFamille.objects.none()

        # Citizens see their own + spouse's requests
        return DemandeLivretFamille.objects.filter(
            Q(citizen=user) |
            Q(cin_epoux=getattr(user, 'cin', '')) |
            Q(cin_epouse=getattr(user, 'cin', ''))
        ).order_by('-created_at')

    def get_serializer_class(self):
        user = self.request.user
        if is_supervisor(user) or is_agent(user):
            return DemandeLivretFamilleAgentSerializer
        return DemandeLivretFamilleSerializer
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if is_supervisor(user):
            return Response({'detail': 'Les superviseurs ne peuvent pas modifier les demandes. Rôle: observateur uniquement.'}, status=status.HTTP_403_FORBIDDEN)
        if is_agent_for_service(user, self.REQUIRED_SERVICE):
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # --- Send Notification ---
            try:
                instance = serializer.instance
                status_display = instance.status
                if hasattr(instance, 'get_status_display'):
                    status_display = instance.get_status_display()
                
                from notifications.helpers import get_notif
                title_n, msg_n = get_notif(instance.citizen, 'livret_updated',
                                           obj_id=instance.id,
                                           status_display=status_display)
                Notification.objects.create(
                    recipient=instance.citizen,
                    title=title_n,
                    message=msg_n,
                    notification_type='success' if instance.status == 'ready' else 'info',
                    link='/mes-demandes'
                )
                
                subject = "Mise à jour: Livret de famille - Kelibia Smart City"
                email_message = f"Bonjour {instance.citizen.first_name},\n\nLe statut de votre demande de livret de famille a été mis à jour.\nNouveau statut : {status_display}.\n\nCordialement,\nL'équipe Kelibia Smart City"
                if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
                    import threading
                    _n = instance.citizen.first_name
                    _e = instance.citizen.email
                    _s = status_display
                    _f = settings.DEFAULT_FROM_EMAIL
                    def _send_livret():
                        try:
                            send_mail(subject, f"Bonjour {_n},\n\nLe statut de votre demande de livret de famille a été mis à jour.\nNouveau statut : {_s}.\n\nCordialement,\nL'équipe Kelibia Smart City", _f, [_e], fail_silently=True)
                        except Exception as ex:
                            print(f"Background livret email failed: {ex}")
                    threading.Thread(target=_send_livret).start()
            except Exception as e:
                print(f"Failed to send notification for livret: {e}")

            return Response(serializer.data)
        return Response({'detail': 'Accès refusé. Vous n\'êtes pas responsable du service État Civil.'}, status=status.HTTP_403_FORBIDDEN)
