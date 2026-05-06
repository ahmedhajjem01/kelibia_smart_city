from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Citoyen, ExtraitNaissance, DeclarationNaissance, DemandeLegalisation, DemandeExtraitNaissance
from .serializers import DeclarationNaissanceSerializer, DemandeLegalisationSerializer, DemandeExtraitNaissanceSerializer

from django.utils import timezone
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

def certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitNaissance, pk=pk)
    
    # Simplified check for PFE defense
    is_valid = extrait.is_paid
            
    token = request.GET.get('token')
    if not is_valid and token:
        try:
            jwt_authenticator = JWTAuthentication()
            validated_token = jwt_authenticator.get_validated_token(token)
            user = jwt_authenticator.get_user(validated_token)
            
            # Verify ownership: if owner, allow access (for PFE, let's be flexible)
            citoyen = None
            try:
                citoyen = Citoyen.objects.get(cin=user.cin)
            except Citoyen.DoesNotExist: pass
            
            if citoyen and (extrait.titulaire == citoyen or extrait.titulaire.pere == citoyen or extrait.titulaire.mere == citoyen):
                is_valid = True
        except: pass

    if not is_valid:
        return render(request, 'errors/unpaid.html', {'extrait': extrait})
        
    if lang == 'fr':
        template = 'extrait_naissance/certificate_fr.html'
    else:
        template = 'extrait_naissance/certificate.html'
    return render(request, template, {'extrait': extrait})


class MesExtraitsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cin = getattr(request.user, 'cin', None)
        if not user_cin:
            return Response({
                "error": "CIN non défini pour cet utilisateur.",
                "mon_extrait": None,
                "enfants": [],
                "conjoints": []
            }, status=200) # Return 200 with empty data instead of 400 error
            
        if not request.user.is_verified:
            return Response({"error": "Votre compte doit être vérifié par l'administration pour accéder à ce service."}, status=403)
            
        try:
            citoyen = Citoyen.objects.get(cin=user_cin)
        except Citoyen.DoesNotExist:
            return Response({
                "info": "Aucun citoyen trouvé avec ce CIN dans le registre de l'État Civil.",
                "mon_extrait": None,
                "enfants": [],
                "conjoints": []
            }, status=200) # Return 200 so frontend doesn't crash
            
        mon_extrait = ExtraitNaissance.objects.filter(titulaire=citoyen).first()
        
        # Optimize child lookup
        enfants_extraits = ExtraitNaissance.objects.filter(
            models.Q(titulaire__pere=citoyen) | models.Q(titulaire__mere=citoyen)
        ).select_related('titulaire')
        
        # Optimize conjoint lookup (parents of your children who are not you)
        conjoint_ids = []
        enfants = Citoyen.objects.filter(models.Q(pere=citoyen) | models.Q(mere=citoyen))
        for enfant in enfants:
            if enfant.pere_id and enfant.pere_id != citoyen.id:
                conjoint_ids.append(enfant.pere_id)
            if enfant.mere_id and enfant.mere_id != citoyen.id:
                conjoint_ids.append(enfant.mere_id)
                
        conjoints_extraits = ExtraitNaissance.objects.filter(
            titulaire_id__in=conjoint_ids
        ).distinct().select_related('titulaire')
        
        now = timezone.now()
        
        def check_paid_validity(obj):
            if not obj or not obj.is_paid or not obj.paid_at:
                return False
            return (now - obj.paid_at).total_seconds() < 86400

        data = {
            "mon_extrait": {
                "id": mon_extrait.id,
                "n_etat_civil": mon_extrait.titulaire.n_etat_civil,
                "nom_complet_fr": f"{mon_extrait.titulaire.prenom_fr} {mon_extrait.titulaire.nom_fr}",
                "nom_complet_ar": f"{mon_extrait.titulaire.prenom_ar} {mon_extrait.titulaire.nom_ar}",
                "date_naissance": mon_extrait.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{mon_extrait.id}/certificate/",
                "url_fr": f"/extrait-naissance/{mon_extrait.id}/certificate/fr/",
                "is_paid": check_paid_validity(mon_extrait)
            } if mon_extrait else None,
            "enfants": [],
            "conjoints": []
        }
        
        for enfant in enfants_extraits:
            data["enfants"].append({
                "id": enfant.id,
                "n_etat_civil": enfant.titulaire.n_etat_civil,
                "nom_complet_fr": f"{enfant.titulaire.prenom_fr} {enfant.titulaire.nom_fr}",
                "nom_complet_ar": f"{enfant.titulaire.prenom_ar} {enfant.titulaire.nom_ar}",
                "date_naissance": enfant.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{enfant.id}/certificate/",
                "url_fr": f"/extrait-naissance/{enfant.id}/certificate/fr/",
                "is_paid": check_paid_validity(enfant)
            })

        for c in conjoints_extraits:
            data["conjoints"].append({
                "id": c.id,
                "n_etat_civil": c.titulaire.n_etat_civil,
                "nom_complet_fr": f"{c.titulaire.prenom_fr} {c.titulaire.nom_fr}",
                "nom_complet_ar": f"{c.titulaire.prenom_ar} {c.titulaire.nom_ar}",
                "date_naissance": c.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{c.id}/certificate/",
                "url_fr": f"/extrait-naissance/{c.id}/certificate/fr/",
                "is_paid": check_paid_validity(c)
            })
            
        return Response(data)



class DeclarationNaissanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            queryset = DeclarationNaissance.objects.all().order_by('-created_at')
        else:
            queryset = DeclarationNaissance.objects.filter(declarant=user).order_by('-created_at')
        serializer = DeclarationNaissanceSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DeclarationNaissanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(declarant=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class DeclarationNaissanceDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        declaration = get_object_or_404(DeclarationNaissance, pk=pk)
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor') or declaration.declarant == user):
            return Response({"error": "Non autorisé"}, status=403)
        serializer = DeclarationNaissanceSerializer(declaration)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor')):
             return Response({"error": "Seuls les agents peuvent modifier le statut."}, status=403)
        declaration = get_object_or_404(DeclarationNaissance, pk=pk)
        new_status = request.data.get('status')
        if new_status in ['validated', 'rejected']:
            declaration.status = new_status
            declaration.save()
            
            # --- Send Notification ---
            try:
                status_display = declaration.status
                if hasattr(declaration, 'get_status_display'):
                    status_display = declaration.get_status_display()
                
                from notifications.helpers import get_notif
                title_n, msg_n = get_notif(declaration.declarant, 'birth_updated',
                                           obj_id=declaration.id, status_display=status_display)
                Notification.objects.create(
                    recipient=declaration.declarant,
                    title=title_n,
                    message=msg_n,
                    notification_type='success' if declaration.status == 'validated' else 'info',
                    link='/mes-demandes'
                )
                
                subject = "Mise à jour: Déclaration de Naissance - Kelibia Smart City"
                if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
                    import threading
                    _n = declaration.declarant.first_name
                    _e = declaration.declarant.email
                    _s = status_display
                    _f = settings.DEFAULT_FROM_EMAIL
                    def _send_birth():
                        try:
                            send_mail(subject, f"Bonjour {_n},\n\nLe statut de votre déclaration de naissance a été mis à jour.\nNouveau statut : {_s}.\n\nCordialement,\nL'équipe Kelibia Smart City", _f, [_e], fail_silently=True)
                        except Exception as ex:
                            print(f"Background birth email failed: {ex}")
                    threading.Thread(target=_send_birth).start()
            except Exception as e:
                print(f"Failed to send notification for birth decl: {e}")

            return Response({"status": declaration.status})
        return Response({"error": "Statut invalide"}, status=400)

def verify_birth_certificate_view(request, cert_uuid):
    extrait = get_object_or_404(ExtraitNaissance, uuid=cert_uuid)
    return render(request, 'extrait_naissance/verify.html', {'extrait': extrait})

class DemandeLegalisationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        my_requests = DemandeLegalisation.objects.filter(citizen=request.user).order_by('-created_at')
        serializer = DemandeLegalisationSerializer(my_requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeLegalisationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(citizen=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DemandeExtraitNaissanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor'):
            qs = DemandeExtraitNaissance.objects.all().order_by('-created_at')
        else:
            qs = DemandeExtraitNaissance.objects.filter(citizen=user).order_by('-created_at')
        serializer = DemandeExtraitNaissanceSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeExtraitNaissanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(citizen=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DemandeExtraitNaissanceDetailAPIView(APIView):
    """Allows agents to update status + note_agent."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor')):
            return Response({'error': 'Non autorisé'}, status=403)
        demande = get_object_or_404(DemandeExtraitNaissance, pk=pk)
        new_status = request.data.get('status')
        if new_status not in ('processed', 'rejected'):
            return Response({'error': 'Statut invalide'}, status=400)
        demande.status = new_status
        if 'note_agent' in request.data:
            demande.note_agent = request.data['note_agent']
        demande.save()
        return Response({'status': demande.status, 'note_agent': demande.note_agent})
