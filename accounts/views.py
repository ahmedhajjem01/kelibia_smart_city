import logging
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from djoser.serializers import ActivationSerializer
from .serializers import CustomUserSerializer

User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        try:
            data = request.data
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
                is_active=False # Deactivate until verified
            )
            
            from djoser.email import ActivationEmail
            context = {"user": user}
            to = [user.email]
            ActivationEmail(request, context).send(to)
            
            return Response({
                "message": "Utilisateur créé avec succès! Veuillez vérifier votre email pour activer votre compte.",
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
