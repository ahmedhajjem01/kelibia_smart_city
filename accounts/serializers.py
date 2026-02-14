from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
print("DEBUG: accounts/serializers.py LOADED")
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
            "validation_method",
        )
