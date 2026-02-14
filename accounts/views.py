from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import IntegrityError
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class RegisterView(APIView):
    def post(self, request):
        try:
            data = request.data
            password = data.get('password')
            
            required_fields = ['username', 'password', 'email', 'first_name', 'last_name', 'cin', 'phone', 'governorate', 'city']
            missing = [f for f in required_fields if not data.get(f)]
            if missing:
                return Response({"error": f"Champs manquants: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=password,
                first_name=data['first_name'],
                last_name=data['last_name'],
                cin=data['cin'],
                phone=data['phone'],
                address=data.get('address', ''),
                governorate=data['governorate'],
                city=data['city'],
                validation_method=data.get('validation_method', 'email')
            )
            
            return Response({
                "message": "Utilisateur créé avec succès!",
                "username": user.username,
                "validation_method": user.validation_method
            }, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            err_msg = str(e)
            if 'cin' in err_msg.lower():
                return Response({"error": "Ce CIN est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            if 'phone' in err_msg.lower():
                return Response({"error": "Ce numéro de téléphone est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            if 'username' in err_msg.lower():
                return Response({"error": "Ce nom d'utilisateur est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": f"Erreur d'intégrité"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Une erreur interne est survenue."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifySMSView(APIView):
    def post(self, request):
        username = request.data.get('username')
        code = request.data.get('otp_code')
        
        try:
            user = User.objects.get(username=username, otp_code=code)
            user.is_active = True
            user.is_verified = True
            user.otp_code = "" # Clear code after use
            user.save()
            return Response({"message": "Compte activé avec succès !"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Code invalide ou utilisateur non trouvé."}, status=status.HTTP_400_BAD_REQUEST)
