from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = DjoserUserCreateSerializer.Meta.fields + (
            "cin",
            "phone",
            "address",
            "governorate",
            "city",
        )

class CustomUserSerializer(serializers.ModelSerializer):
    from rest_framework import serializers
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'cin', 'phone', 'address', 'governorate', 'city', 'user_type', 'is_verified')
