from django.contrib.auth import get_user_model, login, logout
from django.shortcuts import redirect
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from djoser.serializers import ActivationSerializer
from .serializers import CustomUserSerializer, MyTokenObtainPairSerializer

User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        try:
            data = request.data
            files = request.FILES
            password = data.get('password')
            
            required_fields = ['username', 'password', 'email', 'first_name', 'last_name', 'cin', 'phone', 'governorate', 'city', 'address']
            missing = [f for f in required_fields if not data.get(f)]
            if missing:
                return Response({"error": f"Champs manquants: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Strong Password Validation
            try:
                validate_password(password)
            except Exception as e:
                return Response({"error": f"Mot de passe trop faible: {', '.join(e.messages) if hasattr(e, 'messages') else str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=password,
                first_name=data['first_name'],
                last_name=data['last_name'],
                cin=data['cin'],
                phone=data['phone'],
                address=data['address'],
                governorate=data['governorate'],
                city=data['city'],
                is_active=True, # Allow immediate login
                is_verified=False # Pending admin review
            )
            
            # Save CIN images if provided
            if 'cin_front_image' in files:
                user.cin_front_image = files['cin_front_image']
            if 'cin_back_image' in files:
                user.cin_back_image = files['cin_back_image']
            
            if 'cin_front_image' in files or 'cin_back_image' in files:
                user.save()
            
            return Response({
                "message": "Utilisateur créé avec succès ! Votre compte est en attente de vérification par un administrateur.",
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
            return Response({"error": "Erreur d'intégrité (conflit de données)."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Une erreur interne est survenue."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomActivationView(APIView):
    """
    Custom Activation View that activates the user AND returns JWT tokens
    to allow auto-login on the frontend.
    """
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
    Returns the current user's profile information.
    """
    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

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
from rest_framework import permissions

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
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
            return Response({"error": "Accès refusé."}, status=403)
        
        # Get mode: 'unverified' or 'all'
        mode = request.query_params.get('mode', 'unverified')
        
        if mode == 'unverified':
            users = User.objects.filter(is_verified=False, user_type='citizen').order_by('-date_joined')
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
            "cin_front": u.cin_front_image.url if u.cin_front_image else None,
            "cin_back": u.cin_back_image.url if u.cin_back_image else None,
        } for u in users]
        
        return Response(data)

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor'):
            return Response({"error": "Accès refusé."}, status=403)
        
        user_id = request.data.get('user_id')
        action = request.data.get('action') # 'verify' or 'toggle_active'
        
        try:
            target_user = User.objects.get(id=user_id)
            if action == 'verify':
                target_user.is_verified = True
                target_user.save()
                return Response({"message": "Compte citoyen vérifié avec succès."})
            elif action == 'toggle_active':
                target_user.is_active = not target_user.is_active
                target_user.save()
                return Response({
                    "message": f"Statut du compte mis à jour (Actif: {target_user.is_active}).",
                    "is_active": target_user.is_active
                })
            else:
                return Response({"error": "Action non reconnue."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

def admin_logout(request):


    """
    Custom logout view for the admin to redirect to the frontend.
    """
    from django.conf import settings
    logout(request)
    protocol = "https" if not settings.DEBUG else "http"
    domain = settings.DOMAIN
    return redirect(f'{protocol}://{domain}/login')
