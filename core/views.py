from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from livret_famille.models import DemandeLivretFamille
from attestation_residence.models import DemandeResidence
from extrait_naissance.models import ExtraitNaissance, DeclarationNaissance
from extrait_mariage.models import ExtraitMariage, DemandeMariage
from extrait_deces.models import ExtraitDeces, DeclarationDeces
from eau_lumiere_egouts.models import DemandeEau
from argent_impots.models import DemandeImpot
from boutiques_commerces.models import DemandeCommerce
from social_evenements.models import DemandeEvenement
from maison_construction.models import DemandeConstruction, DemandeGoudronnage, DemandeCertificatVocation, DemandeRaccordement


def login_redirect(request):
    """
    Redirects legacy login calls to the React frontend login page.
    This prevents 500 errors from Django internals that expect a 'login' named route.
    """
    return redirect('/login')

from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """
    Simulation PFE : Reçoit un signal de paiement réussi et met à jour la demande correspondante.
    """
    req_id = request.data.get('request_id')
    req_type = request.data.get('request_type')
    paid = request.data.get('paiement_recu', False)

    if not paid:
        return Response({"error": "Paiement non reçu"}, status=400)

    try:
        now = timezone.now()
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
            obj.paid_at = now
            obj.save()
        elif req_type == 'marriage_extract':
            obj = ExtraitMariage.objects.get(id=req_id, user=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'death_extract' or req_type == 'deces':
            obj = ExtraitDeces.objects.get(id=req_id, user=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'marriage':
            obj = DemandeMariage.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'construction':
            obj = DemandeConstruction.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'goudronnage':
            obj = DemandeGoudronnage.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'vocation':
            obj = DemandeCertificatVocation.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        elif req_type == 'evenement':
            obj = DemandeEvenement.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            # Evenement model has is_paid (verbose="Frais de dossier réglés") but not paid_at? 
            # I checked models.py, it was missing paid_at. Let's just set is_paid.
            obj.save()
        elif req_type == 'raccordement':
            obj = DemandeRaccordement.objects.get(id=req_id, citizen=request.user)
            obj.is_paid = True
            obj.paid_at = now
            obj.save()
        else:
            return Response({"error": "Type de demande inconnu"}, status=400)


        return Response({"status": "Success", "message": "Paiement confirmed, status updated."})
    except Exception as e:
        return Response({"error": f"Demande introuvable: {str(e)}"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_supervisor_services_summary(request):
    """
    Returns counts of pending requests across all administrative services
    for the supervisor dashboard.
    """
    if not (request.user.is_staff or getattr(request.user, 'user_type', '') in ['supervisor', 'agent']):
        return Response({"error": "Accès refusé"}, status=403)

    summary = {
        "attestation_residence": DemandeResidence.objects.filter(status='pending', is_paid=True).count(),
        "livret_famille": DemandeLivretFamille.objects.filter(status='pending', is_paid=True).count(),
        "declaration_naissance": DeclarationNaissance.objects.filter(status='pending', is_paid=True).count(),
    }
    
    summary["demande_mariage"] = DemandeMariage.objects.filter(status='pending', is_paid=True).count()
    
    # Death requests
    summary["declaration_deces"] = DeclarationDeces.objects.filter(status='pending', is_paid=True).count()

    summary["eau"] = DemandeEau.objects.filter(status='pending').count()
    summary["impots"] = DemandeImpot.objects.filter(status='pending').count()
    summary["commerce"] = DemandeCommerce.objects.filter(status='pending').count()

    return Response(summary)

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_supervisor_orders(request, order_type=None, order_id=None):
    """
    Unified view to List, Update status or Delete any administrative request/order.
    """
    if not (request.user.is_staff or getattr(request.user, 'user_type', '') in ['supervisor', 'agent']):
        return Response({"error": "Accès refusé"}, status=403)

    models_map = {
        'residence': DemandeResidence,
        'livret': DemandeLivretFamille,
        'naissance': DeclarationNaissance,
        'mariage_extrait': ExtraitMariage,
        'deces_extrait': ExtraitDeces,
        'mariage': DemandeMariage,
        'deces': DeclarationDeces,
        'eau': DemandeEau,
        'impots': DemandeImpot,
        'commerce': DemandeCommerce,
        'construction': DemandeConstruction,
        'goudronnage': DemandeGoudronnage,
        'vocation': DemandeCertificatVocation,
        'raccordement': DemandeRaccordement,
        'evenement': DemandeEvenement
    }

    if request.method == 'GET':
        resp = []
        for key, model in models_map.items():
            objs = model.objects.all().select_related('citizen' if hasattr(model, 'citizen') else 'user')
            
            # SI: Filter out unpaid requests - only show to admin after payment
            if hasattr(model, 'is_paid'):
                objs = objs.filter(is_paid=True)
                
            objs = objs.order_by('-created_at')
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
                elif key == 'eau':
                    details = {
                        "service_type": getattr(o, 'service_type', ''),
                        "service_type_label": o.get_service_type_display() if hasattr(o, 'get_service_type_display') else '',
                        "adresse": getattr(o, 'adresse', ''),
                        "description": getattr(o, 'description', ''),
                        "commentaire_agent": getattr(o, 'commentaire_agent', ''),
                    }
                elif key == 'impots':
                    details = {
                        "service_type": getattr(o, 'service_type', ''),
                        "service_type_label": o.get_service_type_display() if hasattr(o, 'get_service_type_display') else '',
                        "adresse_bien": getattr(o, 'adresse_bien', ''),
                        "description": getattr(o, 'description', ''),
                        "commentaire_agent": getattr(o, 'commentaire_agent', ''),
                    }
                elif key == 'commerce':
                    details = {
                        "service_type": getattr(o, 'service_type', ''),
                        "service_type_label": o.get_service_type_display() if hasattr(o, 'get_service_type_display') else '',
                        "nom_commerce": getattr(o, 'nom_commerce', ''),
                        "adresse_commerce": getattr(o, 'adresse_commerce', ''),
                        "description": getattr(o, 'description', ''),
                        "commentaire_agent": getattr(o, 'commentaire_agent', ''),
                    }
                elif key == 'mariage':
                    details = {
                        "epoux": getattr(o, 'nom_epoux', ''),
                        "epouse": getattr(o, 'nom_epouse', ''),
                        "date_mariage": str(getattr(o, 'date_souhaitee', '')),
                        "regime": getattr(o, 'regime_matrimonial', ''),
                    }
                elif key == 'deces':
                    details = {
                        "nom_defunt": f"{getattr(o, 'nom_fr', '')} {getattr(o, 'prenom_fr', '')}",
                        "date_deces": str(getattr(o, 'date_deces', '')),
                        "lieu_deces": getattr(o, 'lieu_deces_fr', ''),
                    }
                elif key == 'construction':
                    details = {
                        "adresse": getattr(o, 'adresse_terrain', ''),
                        "type": getattr(o, 'type_travaux', ''),
                        "usage": getattr(o, 'usage_batiment', ''),
                    }
                elif key == 'goudronnage':
                    details = {
                        "adresse": getattr(o, 'adresse_residence', ''),
                        "rue": getattr(o, 'localisation_rue', ''),
                    }
                elif key == 'vocation':
                    details = {
                        "adresse": getattr(o, 'adresse_bien', ''),
                    }
                elif key == 'raccordement':
                    details = {
                        "reseau": getattr(o, 'type_reseau', ''),
                        "adresse": getattr(o, 'adresse_raccordement', ''),
                    }
                elif key == 'evenement':
                    details = {
                        "titre": getattr(o, 'titre_evenement', ''),
                        "lieu": getattr(o, 'lieu_details', ''),
                        "date": f"{getattr(o, 'date_debut', '')} au {getattr(o, 'date_fin', '')}",
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
