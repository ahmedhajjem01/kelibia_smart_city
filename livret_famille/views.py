from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeLivretFamille
from .serializers import DemandeLivretFamilleSerializer, DemandeLivretFamilleAgentSerializer

from django.db.models import Q
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings

class DemandeLivretFamilleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            # NEW: Only paid requests reach the agent queue
            return DemandeLivretFamille.objects.filter(is_paid=True).order_by('-created_at')

        
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
            
            # --- Send Notification ---
            try:
                instance = serializer.instance
                status_display = instance.status
                if hasattr(instance, 'get_status_display'):
                    status_display = instance.get_status_display()
                
                Notification.objects.create(
                    recipient=instance.citizen,
                    title="Mise à jour: Livret de famille",
                    message=f"Le statut de votre demande de livret de famille #{instance.id} a été mis à jour: {status_display}.",
                    notification_type='success' if instance.status == 'ready' else 'info',
                    link='/mes-demandes'
                )
                
                subject = "Mise à jour: Livret de famille - Kelibia Smart City"
                email_message = f"Bonjour {instance.citizen.first_name},\n\nLe statut de votre demande de livret de famille a été mis à jour.\nNouveau statut : {status_display}.\n\nCordialement,\nL'équipe Kelibia Smart City"
                send_mail(subject, email_message, settings.DEFAULT_FROM_EMAIL, [instance.citizen.email], fail_silently=True)
            except Exception as e:
                print(f"Failed to send notification for livret: {e}")

            return Response(serializer.data)
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
