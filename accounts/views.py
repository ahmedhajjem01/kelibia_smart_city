from django.contrib.auth import get_user_model, login, logout
from django.shortcuts import redirect
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from djoser.serializers import ActivationSerializer
from .serializers import CustomUserSerializer, MyTokenObtainPairSerializer
from datetime import date
import base64
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            payload = request.data
            files = request.FILES
            password = payload.get('password')
            
            required_fields = ['username', 'password', 'email', 'first_name', 'last_name', 'cin', 'phone', 'governorate', 'city', 'address', 'date_of_birth']
            missing = [f for f in required_fields if not payload.get(f)]
            if missing:
                return Response({"error": f"Champs manquants: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Age validation (18+)
            dob_str = payload.get('date_of_birth')
            dob_obj = None
            if dob_str:
                try:
                    dob_obj = date.fromisoformat(dob_str)
                    today = date.today()
                    age = today.year - dob_obj.year - ((today.month, today.day) < (dob_obj.month, dob_obj.day))
                    if age < 18:
                        return Response({"error": "Vous devez avoir au moins 18 ans pour créer un compte ."}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({"error": "Format de date de naissance invalide. Utilisez AAAA-MM-JJ."}, status=status.HTTP_400_BAD_REQUEST)

            # Strong Password Validation
            try:
                validate_password(password)
            except Exception as e:
                return Response({"error": f"Mot de passe trop faible: {', '.join(e.messages) if hasattr(e, 'messages') else str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=payload['username'],
                email=payload['email'],
                password=password,
                first_name=payload['first_name'],
                last_name=payload['last_name'],
                cin=payload['cin'],
                phone=payload['phone'],
                address=payload['address'],
                governorate=payload['governorate'],
                city=payload['city'],
                is_active=True,
                is_verified=False,
                date_of_birth=dob_obj,
                place_of_birth=payload.get('place_of_birth', ''),
                is_married=payload.get('is_married') == 'true',
                spouse_cin=payload.get('spouse_cin', ''),
                spouse_first_name=payload.get('spouse_first_name', ''),
                spouse_last_name=payload.get('spouse_last_name', '')
            )
            
            # Handle CIN images as Base64 strings for Vercel compatibility
            if 'cin_front_image' in files:
                f = files['cin_front_image']
                user.cin_front_utf = f"data:{f.content_type};base64,{base64.b64encode(f.read()).decode('utf-8')}"
            if 'cin_back_image' in files:
                f = files['cin_back_image']
                user.cin_back_utf = f"data:{f.content_type};base64,{base64.b64encode(f.read()).decode('utf-8')}"
            
            user.save()
            
            return Response({
                "message": "Utilisateur créé avec succès ! Veuillez vous connecter.",
                "username": user.username
            }, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            err_msg = str(e)
            if 'email' in err_msg.lower():
                return Response({"error": "Cette adresse email est déjà utilisée."}, status=status.HTTP_400_BAD_REQUEST)
            if 'cin' in err_msg.lower():
                return Response({"error": "Ce CIN est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            if 'phone' in err_msg.lower():
                return Response({"error": "Ce numéro de téléphone est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            if 'username' in err_msg.lower():
                return Response({"error": "Ce nom d'utilisateur est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Detailed fallback for debugging
            return Response({"error": f"Conflit de données: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            # Handle Django validation errors (like invalid username characters)
            return Response({"error": f"Erreur de validation: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Registration Error: {str(e)}\n{error_details}")
            return Response({"error": f"Erreur Interne: {str(e)}", "details": error_details}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class CustomActivationView(APIView):
    """
    Custom Activation View that activates the user AND returns JWT tokens
    to allow auto-login on the frontend.
    """
    permission_classes = [permissions.AllowAny]
    token_generator = default_token_generator

    def post(self, request, *args, **kwargs):
        serializer = ActivationSerializer(data=request.data, context={'view': self})
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        user.is_active = True
        user.is_verified = True
        user.save()

        # Generate tokens for the user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "message": "Compte activé avec succès !",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username
        }, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    """
    GET  — returns the current user's profile information.
    PATCH — updates editable profile fields (no email, cin, or user_type changes).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        allowed = ['first_name', 'last_name', 'phone', 'address', 'city', 'governorate', 'place_of_birth']
        data = {k: v for k, v in request.data.items() if k in allowed and v is not None}
        if not data:
            return Response({"error": "Aucun champ modifiable fourni."}, status=status.HTTP_400_BAD_REQUEST)
        for attr, value in data.items():
            setattr(request.user, attr, value)
        request.user.save(update_fields=list(data.keys()))
        return Response(CustomUserSerializer(request.user).data)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get('email')
            user = User.objects.filter(email=email).first()
            if user and (user.is_staff or user.is_superuser):
                login(request, user)
        return response

from .models import SavedCard

class SavedCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cards = SavedCard.objects.filter(user=request.user).order_by('-created_at')
        data = [{
            "id": c.id,
            "card_holder": c.card_holder,
            "last_4": c.last_4,
            "expiry": c.expiry,
            "brand": c.brand
        } for c in cards]
        return Response(data)

    def post(self, request):
        data = request.data
        # Simulated validation
        if not all(k in data for k in ['number', 'expiry', 'name']):
            return Response({"error": "Données de carte incomplètes"}, status=400)
        
        last_4 = data['number'][-4:]
        
        # Check if card already saved (simplified)
        if SavedCard.objects.filter(user=request.user, last_4=last_4, expiry=data['expiry']).exists():
            return Response({"message": "Carte déjà enregistrée"})

        SavedCard.objects.create(
            user=request.user,
            card_holder=data['name'],
            last_4=last_4,
            expiry=data['expiry'],
            brand='Visa' if data['number'].startswith('4') else 'Mastercard'
        )
        return Response({"message": "Carte enregistrée avec succès !"}, status=201)

class UserVerificationView(APIView):
    """
    Supervisor view for listing and approving unverified citizens,
    and managing all users (listing, activating, deactivating).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') in ('supervisor', 'agent')):
            return Response({"error": "Accès refusé."}, status=403)
        
        # Get mode: 'unverified', 'agents', or 'all'
        mode = request.query_params.get('mode', 'unverified')

        if mode == 'unverified':
            users = User.objects.filter(is_verified=False, user_type='citizen').order_by('-date_joined')
        elif mode == 'agents':
            users = User.objects.filter(user_type__in=['agent', 'supervisor']).order_by('-date_joined')
        else:
            users = User.objects.all().order_by('-date_joined')

        data = [{
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": f"{u.first_name} {u.last_name}",
            "cin": u.cin,
            "phone": u.phone,
            "date_joined": u.date_joined,
            "is_verified": u.is_verified,
            "is_active": u.is_active,
            "user_type": u.user_type,
            "date_of_birth": u.date_of_birth,
            "place_of_birth": u.place_of_birth,
            "is_married": u.is_married,
            "spouse_cin": u.spouse_cin,
            "spouse_first_name": u.spouse_first_name,
            "spouse_last_name": u.spouse_last_name,
            "cin_front": u.cin_front_utf if u.cin_front_utf else (u.cin_front_image if u.cin_front_image else None),
            "cin_back": u.cin_back_utf if u.cin_back_utf else (u.cin_back_image if u.cin_back_image else None),
            "asd_active": u.asd_active,
            "asd_expiration": u.asd_expiration,
            "has_active_asd": u.has_active_asd,
        } for u in users]
        
        return Response(data)

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') in ('supervisor', 'agent')):
            return Response({"error": "Accès refusé."}, status=403)

        user_id = request.data.get('user_id')
        action = request.data.get('action') # 'verify' or 'toggle_active'
        
        try:
            target_user = User.objects.get(id=user_id)
            if action == 'verify':
                target_user.is_verified = True
                # Effacer les images du CIN pour la confidentialité après vérification
                target_user.cin_front_utf = None
                target_user.cin_back_utf = None
                target_user.cin_front_image = None
                target_user.cin_back_image = None
                target_user.save()
                return Response({"message": "Compte citoyen vérifié avec succès. Les images du CIN ont été supprimées par mesure de confidentialité."})
            elif action == 'toggle_active':
                target_user.is_active = not target_user.is_active
                target_user.save()
                return Response({
                    "message": f"Statut du compte mis à jour (Actif: {target_user.is_active}).",
                    "is_active": target_user.is_active
                })
            elif action == 'delete':
                target_user.delete()
                return Response({"message": "Utilisateur supprimé avec succès."})
            elif action == 'promote_to_agent':
                target_user.user_type = 'agent'
                target_user.is_staff = True
                target_user.save()
                return Response({"message": "L'utilisateur a été promu au rang d'Agent."})
            elif action == 'promote_to_supervisor':
                target_user.user_type = 'supervisor'
                target_user.is_staff = True
                target_user.is_superuser = True
                target_user.save()
                return Response({"message": "L'utilisateur a été promu au rang de Superviseur."})
            elif action == 'demote_to_citizen':
                if not request.user.is_superuser:
                    return Response({"error": "Seul un superutilisateur peut rétrograder un agent."}, status=403)
                target_user.user_type = 'citizen'
                target_user.is_staff = False
                target_user.is_superuser = False
                target_user.is_verified = False
                target_user.save()
                return Response({"message": "L'agent a été rétrogradé au rang de Citoyen."})
            elif action == 'reset_password':
                if not request.user.is_superuser:
                    return Response({"error": "Seul un superutilisateur peut réinitialiser les mots de passe."}, status=403)
                import secrets, string
                alphabet = string.ascii_letters + string.digits + '!@#$'
                new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
                target_user.set_password(new_password)
                target_user.save()
                return Response({"message": f"Mot de passe réinitialisé.", "new_password": new_password})
            elif action == 'activate_asd':
                from django.utils import timezone
                # Activating ASD implies physical verification of CIN, so we also verify the account
                target_user.is_verified = True
                target_user.asd_active = True
                duration_months = int(request.data.get('duration_months', 12))
                target_user.asd_expiration = timezone.now() + timezone.timedelta(days=30 * duration_months)
                target_user.save()
                return Response({
                    'message': f'Abonnement ASD activé pour {duration_months} mois (et compte vérifié).',
                    'asd_expiration': target_user.asd_expiration,
                    'is_verified': True
                })
            else:
                return Response({"error": "Action non reconnue."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

class AdminUserCreateView(APIView):
    """
    Supervisor endpoint to create agents or other supervisors directly.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
            return Response({"error": "Accès refusé."}, status=403)
        
        data = request.data
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                cin=data.get('cin', f"SYS{User.objects.count()}"),
                phone=data.get('phone', f"0000{User.objects.count()}"),
                user_type=data.get('user_type', 'agent'),
                is_staff=True,
                is_verified=True,
                is_active=True
            )
            if user.user_type == 'supervisor':
                user.is_superuser = True
                user.save()
            
            return Response({"message": f"Nouvel utilisateur '{user.username}' créé avec succès."}, status=201)
        except Exception as e:
            return Response({"error": f"Erreur lors de la création: {str(e)}"}, status=400)

class AgentCitizenVerificationView(APIView):
    """
    Agent-accessible endpoint to list and verify unverified CITIZENS only.
    Agents can only see citizen accounts (not agents or admins).
    Supervisors use the full UserVerificationView instead.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _is_agent_or_above(self, user):
        return (
            getattr(user, 'user_type', '') in ('agent', 'supervisor')
            or user.is_staff
            or user.is_superuser
        )

    def get(self, request):
        if not self._is_agent_or_above(request.user):
            return Response({"error": "Accès refusé. Réservé aux agents."}, status=403)

        # Agents can only see unverified citizens
        users = User.objects.filter(
            is_verified=False,
            user_type='citizen',
        ).order_by('date_joined')

        data = [{
            "id": u.id,
            "full_name": f"{u.first_name} {u.last_name}".strip() or u.username,
            "email": u.email,
            "cin": u.cin,
            "phone": u.phone,
            "governorate": u.governorate,
            "city": u.city,
            "date_of_birth": u.date_of_birth,
            "place_of_birth": u.place_of_birth,
            "date_joined": u.date_joined,
            "is_active": u.is_active,
            "cin_front": u.cin_front_utf if u.cin_front_utf else (u.cin_front_image if u.cin_front_image else None),
            "cin_back": u.cin_back_utf if u.cin_back_utf else (u.cin_back_image if u.cin_back_image else None),
        } for u in users]

        return Response(data)

    def post(self, request):
        if not self._is_agent_or_above(request.user):
            return Response({"error": "Accès refusé. Réservé aux agents."}, status=403)

        user_id = request.data.get('user_id')
        action  = request.data.get('action')

        # Agents can only verify or reject (toggle_active) citizens
        allowed_actions = ('verify', 'toggle_active')
        if action not in allowed_actions:
            return Response({"error": f"Action non autorisée pour les agents. Actions permises: {allowed_actions}"}, status=403)

        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

        # Agents cannot act on agents/supervisors/admins
        if target.user_type != 'citizen':
            return Response({"error": "Les agents ne peuvent gérer que les comptes citoyens."}, status=403)

        if action == 'verify':
            target.is_verified = True
            # Clear CIN images after verification (privacy)
            target.cin_front_utf   = None
            target.cin_back_utf    = None
            target.cin_front_image = None
            target.cin_back_image  = None
            target.save()
            return Response({"message": "Compte citoyen vérifié avec succès. Images CIN supprimées."})

        elif action == 'toggle_active':
            target.is_active = not target.is_active
            target.save()
            return Response({
                "message": f"Compte {'activé' if target.is_active else 'bloqué'}.",
                "is_active": target.is_active,
            })



class ConfigView(APIView):
    """
    API to manage global site settings (site_name, maintenance_mode, etc.)
    Only reachable by Supervisors or Staff.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
            return Response({"error": "Accès refusé."}, status=403)
        
        from .models import SiteConfiguration
        config, _ = SiteConfiguration.objects.get_or_create(id=1)
        return Response({
            "site_name": config.site_name,
            "contact_email": config.contact_email,
            "maintenance_mode": config.maintenance_mode
        })

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
            return Response({"error": "Accès refusé."}, status=403)
        
        from .models import SiteConfiguration
        config, _ = SiteConfiguration.objects.get_or_create(id=1)
        
        config.site_name = request.data.get('site_name', config.site_name)
        config.contact_email = request.data.get('contact_email', config.contact_email)
        config.maintenance_mode = request.data.get('maintenance_mode', config.maintenance_mode)
        config.save()
        
        return Response({"message": "Configuration enregistrée avec succès."})


def admin_logout(request):


    """
    Custom logout view for the admin to redirect to the frontend.
    """
    from django.conf import settings
    logout(request)
    protocol = "https" if not settings.DEBUG else "http"
    domain = settings.DOMAIN
    return redirect(f'{protocol}://{domain}/login')
