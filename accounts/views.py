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

def admin_logout(request):
    """
    Custom logout view for the admin to redirect to the frontend.
    """
    logout(request)
    return redirect('http://127.0.0.1:5500/login.html')
