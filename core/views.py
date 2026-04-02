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

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_supervisor_orders(request, order_type=None, order_id=None):
    """
    Unified view to List, Update status or Delete any administrative request/order.
    """
    if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
        return Response({"error": "Accès refusé"}, status=403)

    models_map = {
        'residence': DemandeResidence,
        'livret': DemandeLivretFamille,
        'naissance': DeclarationNaissance,
        'mariage': ExtraitMariage, # Note: Extrait vs Declaration varies, but here we cover the main ones
        'deces': ExtraitDeces
    }

    if request.method == 'GET':
        resp = []
        for key, model in models_map.items():
            objs = model.objects.all().select_related('citizen' if hasattr(model, 'citizen') else 'user').order_by('-created_at')
            for o in objs:
                citizen = getattr(o, 'citizen', getattr(o, 'user', None))
                # Build extra details depending on type
                details = {}
                if key == 'residence':
                    details = {
                        "adresse": getattr(o, 'adresse_demandee', ''),
                        "motif": getattr(o, 'motif_demande', ''),
                        "telephone": getattr(o, 'telephone', ''),
                        "profession": getattr(o, 'profession', ''),
                        "commentaire_agent": getattr(o, 'commentaire_agent', ''),
                    }
                elif key == 'livret':
                    details = {
                        "nom_chef": getattr(o, 'nom_chef_famille', ''),
                        "prenom_chef": getattr(o, 'prenom_chef_famille', ''),
                        "motif": getattr(o, 'motif_demande', ''),
                        "etat_livret": getattr(o, 'etat_livret', ''),
                        "commentaire_agent": getattr(o, 'commentaire_agent', ''),
                    }
                elif key == 'naissance':
                    details = {
                        "prenom_fr": getattr(o, 'prenom_fr', ''),
                        "nom_fr": getattr(o, 'nom_fr', ''),
                        "date_naissance": str(getattr(o, 'date_naissance', '')),
                        "lieu_naissance_fr": getattr(o, 'lieu_naissance_fr', ''),
                        "sexe": getattr(o, 'sexe', ''),
                        "commentaire": getattr(o, 'commentaire', ''),
                    }

                resp.append({
                    "id": o.id,
                    "type": key,
                    "type_label": model._meta.verbose_name,
                    "citizen_name": f"{citizen.first_name} {citizen.last_name}".strip() if citizen else "Inconnu",
                    "citizen_email": citizen.email if citizen else "",
                    "status": getattr(o, 'status', 'approved' if getattr(o, 'is_paid', False) else 'pending'),
                    "is_paid": getattr(o, 'is_paid', False),
                    "created_at": o.created_at,
                    "updated_at": getattr(o, 'updated_at', o.created_at),
                    **details,
                })
        # Sort all by date
        resp.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(resp)

    if request.method == 'POST': # Update Status
        data = request.data
        t = data.get('type')
        oid = data.get('order_id')
        nst = data.get('status')
        if not t or not oid or not nst:
            return Response({"error": "Missing params"}, status=400)
        
        m = models_map.get(t)
        if not m: return Response({"error": "Invalid type"}, status=400)
        
        try:
            o = m.objects.get(id=oid)
            if hasattr(o, 'status'):
                o.status = nst
                o.save()
                return Response({"message": "Statut mis à jour !"})
            return Response({"error": "No status field!"}, status=400)
        except: return Response({"error": "Not found"}, status=404)

    if request.method == 'DELETE':
        t = request.query_params.get('type')
        oid = request.query_params.get('id')
        if not t or not oid: return Response({"error": "Missing params"}, status=400)
        m = models_map.get(t)
        if not m: return Response({"error": "Invalid type"}, status=400)
        try:
            m.objects.get(id=oid).delete()
            return Response({"message": "Supprimé !"})
        except: return Response({"error": "Not found"}, status=404)
