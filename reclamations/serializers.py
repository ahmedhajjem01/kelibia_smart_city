from rest_framework import serializers
from .models import Reclamation
from django.contrib.auth import get_user_model

User = get_user_model()


class ReclamationSerializer(serializers.ModelSerializer):
    """
    Serializer standard — retourne JSON plat avec latitude/longitude séparés.
    Utilisé pour les listes, créations et mises à jour.
    """
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    agent_name   = serializers.ReadOnlyField(source='agent.get_full_name')

    class Meta:
        model  = Reclamation
        fields = [
            'id', 'citizen', 'citizen_name', 'agent', 'agent_name',
            'title', 'description', 'category', 'status',
            'priority', 'service_responsable', 'is_duplicate',
            'image',
            'latitude', 'longitude',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['citizen', 'status', 'agent', 'created_at', 'updated_at',
                            'priority', 'service_responsable', 'is_duplicate']
