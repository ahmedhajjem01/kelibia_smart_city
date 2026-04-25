from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Citoyen, ExtraitNaissance, DeclarationNaissance, DemandeLegalisation
from .serializers import DeclarationNaissanceSerializer, DemandeLegalisationSerializer

from django.utils import timezone
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings

def certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitNaissance, pk=pk)
    
    # Vérification de la validité du paiement (24h)
    is_valid = False
    if extrait.is_paid and extrait.paid_at:
        diff = timezone.now() - extrait.paid_at
        if diff.total_seconds() < 86400: # 24 heures
            is_valid = True
            
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
        user_cin = request.user.cin
        if not user_cin:
            return Response({"error": "CIN non défini pour cet utilisateur."}, status=400)
            
        if not request.user.is_verified:
            return Response({"error": "Votre compte doit être vérifié par l'administration pour accéder à ce service."}, status=403)
            
        try:
            citoyen = Citoyen.objects.get(cin=user_cin)
        except Citoyen.DoesNotExist:
            return Response({
                "error": "Aucun citoyen trouvé avec ce CIN dans le registre de l'État Civil.",
                "mon_extrait": None,
                "enfants": []
            }, status=404)
            
        mon_extrait = ExtraitNaissance.objects.filter(titulaire=citoyen).first()
        enfants_extraits = ExtraitNaissance.objects.filter(
            models.Q(titulaire__pere=citoyen) | models.Q(titulaire__mere=citoyen)
        )
        conjoints_extraits = ExtraitNaissance.objects.filter(
            models.Q(titulaire__enfants_mere__pere=citoyen) |
            models.Q(titulaire__enfants_pere__mere=citoyen)
        ).distinct()
        
        now = timezone.now()
        
        def check_paid_validity(obj):
            if not obj.is_paid or not obj.paid_at:
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

        for conjoint in conjoints_extraits:
            data["conjoints"].append({
                "id": conjoint.id,
                "n_etat_civil": conjoint.titulaire.n_etat_civil,
                "nom_complet_fr": f"{conjoint.titulaire.prenom_fr} {conjoint.titulaire.nom_fr}",
                "nom_complet_ar": f"{conjoint.titulaire.prenom_ar} {conjoint.titulaire.nom_ar}",
                "date_naissance": conjoint.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{conjoint.id}/certificate/",
                "url_fr": f"/extrait-naissance/{conjoint.id}/certificate/fr/",
                "is_paid": check_paid_validity(conjoint)
            })
            
        return Response(data)



class DeclarationNaissanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_staff or getattr(request.user, 'role', '') == 'agent':
            queryset = DeclarationNaissance.objects.all().order_by('-created_at')
        else:
            queryset = DeclarationNaissance.objects.filter(declarant=request.user).order_by('-created_at')
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
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'agent' or declaration.declarant == request.user):
            return Response({"error": "Non autorisé"}, status=403)
        serializer = DeclarationNaissanceSerializer(declaration)
        return Response(serializer.data)

    def patch(self, request, pk):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'agent'):
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
                
                Notification.objects.create(
                    recipient=declaration.declarant,
                    title="Mise à jour: Déclaration de Naissance",
                    message=f"Le statut de votre déclaration de naissance #{declaration.id} a été mis à jour: {status_display}.",
                    notification_type='success' if declaration.status == 'validated' else 'info',
                    link='/mes-demandes'
                )
                
                subject = "Mise à jour: Déclaration de Naissance - Kelibia Smart City"
                email_message = f"Bonjour {declaration.declarant.first_name},\n\nLe statut de votre déclaration de naissance a été mis à jour.\nNouveau statut : {status_display}.\n\nCordialement,\nL'équipe Kelibia Smart City"
                send_mail(subject, email_message, settings.DEFAULT_FROM_EMAIL, [declaration.declarant.email], fail_silently=True)
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
