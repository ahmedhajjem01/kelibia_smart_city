from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ExtraitMariage

def wedding_certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitMariage, pk=pk)
    template_name = 'extrait_mariage/certificate.html' if lang == 'ar' else 'extrait_mariage/certificate_fr.html'
    return render(request, template_name, {'extrait': extrait})

def verify_mariage_certificate_view(request, cert_uuid, lang='ar'):
    extrait = get_object_or_404(ExtraitMariage, uuid=cert_uuid)
    template_name = 'extrait_mariage/verify.html' if lang == 'ar' else 'extrait_mariage/verify_fr.html'
    return render(request, template_name, {'extrait': extrait, 'is_verified': True})

class MesMariagesAPIView(APIView):
    """
    API endpoint that returns the wedding certificates corresponding to the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_verified:
            return Response({"error": "Votre compte doit être vérifié pour accéder à ce service."}, status=403)
        user = request.user
        
        # 1. Try to find by user link
        my_mariage = ExtraitMariage.objects.filter(user=user).first()
        
        # 2. If not found, try to find by CIN
        if not my_mariage and user.cin:
            from extrait_naissance.models import Citoyen
            try:
                citoyen = Citoyen.objects.get(cin=user.cin)
                my_mariage = ExtraitMariage.objects.filter(
                    models.Q(epoux=citoyen) | models.Q(epouse=citoyen)
                ).first()
            except Citoyen.DoesNotExist:
                pass

        if not my_mariage:
            return Response({"mon_mariage": None})

        # Determine if current user is Epoux or Epouse to show the *other* as conjoint
        is_epoux = False
        if user.cin and my_mariage.epoux.cin == user.cin:
            is_epoux = True
        elif my_mariage.user == user:
            # If linked via user model but CIN didn't match (or missing), 
            # we assume they are the person they are linked to.
            # Usually the user is linked to the primary record.
            is_epoux = True # Default to epoux if we don't know
            
        conjoint = my_mariage.epouse if is_epoux else my_mariage.epoux

        data = {
            "mon_mariage": {
                "id": my_mariage.id,
                "numero_registre": my_mariage.numero_registre,
                "annee_acte": my_mariage.annee_acte,
                "conjoint_fr": conjoint.prenom_fr,
                "conjoint_ar": conjoint.prenom_ar,
                "date_mariage": my_mariage.date_mariage,
                "url_ar": f"/extrait-mariage/{my_mariage.id}/certificate/",
                "url_fr": f"/extrait-mariage/{my_mariage.id}/certificate/fr/"
            }
        }
        
        return Response(data)
