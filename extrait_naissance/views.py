from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Citoyen, ExtraitNaissance

def certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitNaissance, pk=pk)
    if lang == 'fr':
        template = 'extrait_naissance/certificate_fr.html'
    else:
        template = 'extrait_naissance/certificate.html'
    return render(request, template, {'extrait': extrait})

class MesExtraitsAPIView(APIView):
    """
    API endpoint that returns the birth certificates corresponding to the logged-in user
    (via their CIN) and the birth certificates of their children.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cin = request.user.cin
        if not user_cin:
            return Response({"error": "CIN non défini pour cet utilisateur."}, status=400)
            
        try:
            citoyen = Citoyen.objects.get(cin=user_cin)
        except Citoyen.DoesNotExist:
            return Response({
                "error": "Aucun citoyen trouvé avec ce CIN dans le registre de l'État Civil.",
                "mon_extrait": None,
                "enfants": []
            }, status=404)
            
        # Mon extrait personnel
        mon_extrait = ExtraitNaissance.objects.filter(titulaire=citoyen).first()
        
        # Les extraits de mes enfants (où je suis le père ou la mère)
        enfants_extraits = ExtraitNaissance.objects.filter(
            models.Q(titulaire__pere=citoyen) | models.Q(titulaire__mere=citoyen)
        )

        # L'extrait de mon conjoint (via les enfants en commun)
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
                "url_fr": f"/extrait-naissance/{mon_extrait.id}/certificate/fr/"
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
                "url_fr": f"/extrait-naissance/{enfant.id}/certificate/fr/"
            })

        for conjoint in conjoints_extraits:
            data["conjoints"].append({
                "id": conjoint.id,
                "n_etat_civil": conjoint.titulaire.n_etat_civil,
                "nom_complet_fr": f"{conjoint.titulaire.prenom_fr} {conjoint.titulaire.nom_fr}",
                "nom_complet_ar": f"{conjoint.titulaire.prenom_ar} {conjoint.titulaire.nom_ar}",
                "date_naissance": conjoint.titulaire.date_naissance,
                "url_ar": f"/extrait-naissance/{conjoint.id}/certificate/",
                "url_fr": f"/extrait-naissance/{conjoint.id}/certificate/fr/"
            })
            
        return Response(data)
def verify_birth_certificate_view(request, cert_uuid):
    extrait = get_object_or_404(ExtraitNaissance, uuid=cert_uuid)
    return render(request, 'extrait_naissance/verify.html', {'extrait': extrait})
