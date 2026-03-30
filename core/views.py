from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from livret_famille.models import DemandeLivretFamille
from attestation_residence.models import DemandeResidence
from extrait_naissance.models import ExtraitNaissance, DeclarationNaissance
from extrait_mariage.models import ExtraitMariage
from extrait_deces.models import ExtraitDeces


def login_redirect(request):
    """
    Redirects legacy login calls to the React frontend login page.
    This prevents 500 errors from Django internals that expect a 'login' named route.
    """
    return redirect('/login')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """
    Simulation PFE : Reçoit un signal de paiement réussi et met à jour la demande correspondante.
    """
    req_id = request.data.get('request_id')
    req_type = request.data.get('request_type') # 'livret' or 'residence'
    paid = request.data.get('paiement_recu', False)

    if not paid:
        return Response({"error": "Paiement non reçu"}, status=400)

    try:
        if req_type == 'livret':
            obj = DemandeLivretFamille.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.status = 'in_progress'
            obj.save()
        elif req_type == 'residence':
            obj = DemandeResidence.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.status = 'in_progress'
            obj.save()
        elif req_type == 'birth_extract':
            obj = ExtraitNaissance.objects.get(id=req_id, user=request.user)
            obj.is_paid = True
            obj.save()
        elif req_type == 'marriage_extract':
            obj = ExtraitMariage.objects.get(id=req_id, user=request.user)
            obj.is_paid = True
            obj.save()
        else:
            return Response({"error": "Type de demande inconnu"}, status=400)


        return Response({"status": "Success", "message": "Paiement confirmé, statut mis à jour."})
    except (DemandeLivretFamille.DoesNotExist, DemandeResidence.DoesNotExist, ExtraitNaissance.DoesNotExist, ExtraitMariage.DoesNotExist):
        return Response({"error": "Demande ou extrait non trouvé"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_supervisor_services_summary(request):
    """
    Returns counts of pending requests across all administrative services
    for the supervisor dashboard.
    """
    if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
        return Response({"error": "Accès refusé"}, status=403)

    summary = {
        "attestation_residence": DemandeResidence.objects.filter(status='pending').count(),
        "livret_famille": DemandeLivretFamille.objects.filter(status='pending').count(),
        "declaration_naissance": DeclarationNaissance.objects.filter(status='pending').count(),
        # Add others if models have a 'status' field. 
        # Extraits are usually automatic or pay-and-get, but we check if they have pending status.
    }
    
    # Try getting others if they exist with consistent naming
    try:
        from extrait_mariage.models import DeclarationMariage
        summary["declaration_mariage"] = DeclarationMariage.objects.filter(status='pending').count()
    except: pass
    
    try:
        from extrait_deces.models import DeclarationDeces
        summary["declaration_deces"] = DeclarationDeces.objects.filter(status='pending').count()
    except: pass

    return Response(summary)
