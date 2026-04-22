from django.shortcuts import render, get_object_or_404
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ExtraitDeces, DeclarationDeces, DemandeInhumation, DemandeTransfertCorps
from .serializers import (
    DeclarationDecesSerializer, CitoyenSimpleSerializer, 
    DemandeInhumationSerializer, DemandeTransfertCorpsSerializer
)
from extrait_naissance.models import Citoyen

from django.utils import timezone
from .serializers import (
    DeclarationDecesSerializer, CitoyenSimpleSerializer, 
    DemandeInhumationSerializer, ExtraitDecesSerializer
)

def deces_certificate_view(request, pk, lang='ar'):
    extrait = get_object_or_404(ExtraitDeces, pk=pk)
    
    # Vérification de la validité du paiement (24h)
    is_valid = False
    if extrait.is_paid and extrait.paid_at:
        diff = timezone.now() - extrait.paid_at
        if diff.total_seconds() < 86400: # 24 heures
            is_valid = True
            
    if not is_valid:
        return render(request, 'errors/unpaid.html', {'extrait': extrait})

    template_name = 'extrait_deces/certificate.html' if lang == 'ar' else 'extrait_deces/certificate_fr.html'
    return render(request, template_name, {'extrait': extrait})

def verify_deces_view(request, cert_uuid, lang='ar'):
    extrait = get_object_or_404(ExtraitDeces, uuid=cert_uuid)
    template_name = 'extrait_deces/verify.html' if lang == 'ar' else 'extrait_deces/verify_fr.html'
    return render(request, template_name, {'extrait': extrait, 'is_verified': True})

class MesDecesAPIView(APIView):
    """
    API endpoint that returns the death certificates for the logged-in user's family.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cin = request.user.cin
        if not user_cin:
            return Response({"error": "CIN non défini."}, status=400)
            
        try:
            citoyen = Citoyen.objects.get(cin=user_cin)
        except Citoyen.DoesNotExist:
            return Response({"error": "Citoyen introuvable."}, status=404)
            
        from extrait_mariage.models import ExtraitMariage
        mariages = ExtraitMariage.objects.filter(
            models.Q(epoux=citoyen) | models.Q(epouse=citoyen)
        ).only('epoux', 'epouse')
        conjoints = [m.epouse if m.epoux == citoyen else m.epoux for m in mariages]
        
        family_ids = []
        if citoyen.pere: family_ids.append(citoyen.pere.id)
        if citoyen.mere: family_ids.append(citoyen.mere.id)
        for c in conjoints: family_ids.append(c.id)
        
        if citoyen.pere:
            if citoyen.pere.pere: family_ids.append(citoyen.pere.pere.id)
            if citoyen.pere.mere: family_ids.append(citoyen.pere.mere.id)
        if citoyen.mere:
            if citoyen.mere.pere: family_ids.append(citoyen.mere.pere.id)
            if citoyen.mere.mere: family_ids.append(citoyen.mere.mere.id)

        deces_qs = ExtraitDeces.objects.filter(
            models.Q(user=request.user) |
            models.Q(defunt_id__in=family_ids) |
            models.Q(defunt__pere=citoyen) |
            models.Q(defunt__mere=citoyen)
        ).distinct()
        
        serializer = ExtraitDecesSerializer(deces_qs, many=True, context={'request': request})
        return Response({"deces": serializer.data})

from .serializers import DeclarationDecesSerializer, CitoyenSimpleSerializer

class DeclarationDecesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_cin = getattr(request.user, 'cin', None)
        if not user_cin:
            return Response({"eligible_relatives": [], "warning": "CIN non défini pour cet utilisateur."})

        try:
            citoyen = Citoyen.objects.get(cin=user_cin)
        except Citoyen.DoesNotExist:
            return Response({"eligible_relatives": [], "warning": "Aucun dossier citoyen lié à ce compte."})

        try:
            from extrait_mariage.models import ExtraitMariage
            mariages = ExtraitMariage.objects.filter(
                models.Q(epoux=citoyen) | models.Q(epouse=citoyen)
            ).only('epoux', 'epouse')
            conjoints = [m.epouse if m.epoux == citoyen else m.epoux for m in mariages]

            family_members = []
            if citoyen.pere: family_members.append(citoyen.pere)
            if citoyen.mere: family_members.append(citoyen.mere)
            for c in conjoints: family_members.append(c)

            # Ajout des enfants
            enfants = Citoyen.objects.filter(models.Q(pere=citoyen) | models.Q(mere=citoyen))
            for e in enfants:
                family_members.append(e)

            # Ajout des frères et sœurs (même père ou même mère)
            if citoyen.pere or citoyen.mere:
                siblings = Citoyen.objects.filter(
                    (models.Q(pere=citoyen.pere) & models.Q(pere__isnull=False)) |
                    (models.Q(mere=citoyen.mere) & models.Q(mere__isnull=False))
                ).exclude(id=citoyen.id)
                for s in siblings:
                    family_members.append(s)

            already_dead_ids = set(ExtraitDeces.objects.values_list('defunt_id', flat=True))
            pending_decl_ids = set(DeclarationDeces.objects.filter(status='pending').values_list('defunt_id', flat=True))

            eligible = [
                m for m in family_members
                if m.id not in already_dead_ids and m.id not in pending_decl_ids
            ]

            seen_ids = set()
            unique_eligible = []
            for m in eligible:
                if m.id not in seen_ids:
                    unique_eligible.append(m)
                    seen_ids.add(m.id)

            my_declarations = DeclarationDeces.objects.filter(declarant=request.user).order_by('-created_at')
            my_decl_serializer = DeclarationDecesSerializer(my_declarations, many=True)

            serializer = CitoyenSimpleSerializer(unique_eligible, many=True)
            return Response({
                "eligible_relatives": serializer.data,
                "my_declarations": my_decl_serializer.data
            })

        except Exception as exc:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Erreur serveur: {str(exc)}"}, status=500)

    def post(self, request):
        serializer = DeclarationDecesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(declarant=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DemandeInhumationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Lister les déclarations de décès validées de l'utilisateur qui n'ont pas encore de demande d'inhumation
        available_declarations = DeclarationDeces.objects.filter(
            declarant=request.user, 
            status='validated',
            demande_inhumation__isnull=True
        )
        
        my_requests = DemandeInhumation.objects.filter(citizen=request.user)
        
        return Response({
            "available_declarations": DeclarationDecesSerializer(available_declarations, many=True).data,
            "my_requests": DemandeInhumationSerializer(my_requests, many=True).data
        })

    def post(self, request):
        decl_id = request.data.get('declaration_deces')
        if not decl_id:
            return Response({"error": "ID de déclaration de décès requis."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            declaration = DeclarationDeces.objects.get(id=decl_id, declarant=request.user, status='validated')
        except DeclarationDeces.DoesNotExist:
            return Response({"error": "Déclaration valide non trouvée."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Vérifier si une demande existe déjà
        if DemandeInhumation.objects.filter(declaration_deces=declaration).exists():
            return Response({"error": "Une demande d'inhumation existe déjà pour ce décès."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DemandeInhumationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(citizen=request.user, declaration_deces=declaration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DemandeTransfertCorpsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        my_requests = DemandeTransfertCorps.objects.filter(citizen=request.user).order_by('-created_at')
        serializer = DemandeTransfertCorpsSerializer(my_requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeTransfertCorpsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(citizen=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
