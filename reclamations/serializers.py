from rest_framework import serializers
from .models import Reclamation 
from django.contrib.auth import get_user_model

User = get_user_model()

class ReclamationSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    agent_name = serializers.ReadOnlyField(source='agent.get_full_name')

    class Meta:
        model = Reclamation
        fields = [
            'id', 'citizen', 'citizen_name', 'agent', 'agent_name', 
            'title', 'description', 'category', 'status', 
            'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['citizen', 'status', 'agent', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Automatically set the citizen to the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['citizen'] = request.user
        return super().create(validated_data)
