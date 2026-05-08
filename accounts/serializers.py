from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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
    # Safe accessor: returns None if the column doesn't exist yet (pre-migration)
    assigned_service = serializers.SerializerMethodField()

    def get_assigned_service(self, obj):
        return getattr(obj, 'assigned_service', None)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'first_name_ar', 'last_name_ar', 'cin', 'phone', 'address',
            'governorate', 'city', 'date_of_birth', 'place_of_birth',
            'user_type', 'assigned_service', 'is_verified', 'is_staff',
            'is_superuser', 'has_active_asd', 'asd_expiration', 'preferred_language',
        )

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Support CIN as identifier
        username = attrs.get(self.username_field)
        if username and '@' not in username:
            user = User.objects.filter(cin=username).first()
            if user:
                attrs[self.username_field] = user.email

        data = super().validate(attrs)
        data['is_staff'] = self.user.is_staff
        data['is_superuser'] = self.user.is_superuser
        data['user_type'] = self.user.user_type
        # getattr guards against the column not yet existing in DB (pre-migration)
        data['assigned_service'] = getattr(self.user, 'assigned_service', None)
        return data
