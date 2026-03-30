from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Citoyen, ExtraitNaissance, DeclarationNaissance
from .serializers import DeclarationNaissanceSerializer

def certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitNaissance, pk=pk)
    if not extrait.is_paid:
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
        
        data = {
            "mon_extrait": {
                "id": mon_extrait.id,
                "n_etat_civil": mon_extrait.titulaire.n_etat_civil,
                "nom_complet_fr": f"{mon_extrait.titulaire.prenom_fr} {mon_extrait.titulaire.nom_fr}",
                "nom_complet_ar": f"{mon_extrait.titulaire.prenom_ar} {mon_extrait.titulaire.nom_ar}",
                "date_naissance": mon_extrait.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{mon_extrait.id}/certificate/",
                "url_fr": f"/extrait-naissance/{mon_extrait.id}/certificate/fr/",
                "is_paid": mon_extrait.is_paid
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
                "is_paid": enfant.is_paid
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
                "is_paid": conjoint.is_paid
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
            return Response({"status": declaration.status})
        return Response({"error": "Statut invalide"}, status=400)

def verify_birth_certificate_view(request, cert_uuid):
    extrait = get_object_or_404(ExtraitNaissance, uuid=cert_uuid)
    return render(request, 'extrait_naissance/verify.html', {'extrait': extrait})
