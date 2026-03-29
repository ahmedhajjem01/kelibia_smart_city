from rest_framework import serializers
from .models import Reclamation
from django.contrib.auth import get_user_model

User = get_user_model()


class ReclamationSerializer(serializers.ModelSerializer):
    """
    Serializer standard — retourne JSON plat avec latitude/longitude séparés.
    Inclut un champ 'confidence' calculé à la volée par le modèle ML
    (recalculé sur title+description à chaque sérialisation).
    """
    citizen_name = serializers.SerializerMethodField()
    agent_name   = serializers.SerializerMethodField()
    confidence   = serializers.SerializerMethodField()

    def get_citizen_name(self, obj):
        name = obj.citizen.get_full_name().strip() if obj.citizen else ''
        return name if name else (obj.citizen.email if obj.citizen else '—')

    def get_agent_name(self, obj):
        if not obj.agent:
            return None
        name = obj.agent.get_full_name().strip()
        return name if name else obj.agent.email

    def get_confidence(self, obj):
        """
        Re-run the ML classifier on this reclamation's text and return
        confidence scores for category and priority predictions.
        This works for ALL reclamations, including old ones in the DB.
        """
        try:
            from .classifier import classify
            result = classify(obj.title, obj.description or '', obj.category)
            return result.get('confidence', {'category': None, 'priority': None})
        except Exception:
            return {'category': None, 'priority': None}

    class Meta:
        model  = Reclamation
        fields = [
            'id', 'citizen', 'citizen_name', 'agent', 'agent_name',
            'title', 'description', 'category', 'status',
            'priority', 'service_responsable', 'is_duplicate',
            'image',
            'latitude', 'longitude',
            'created_at', 'updated_at',
            'confidence',
        ]
        read_only_fields = ['citizen', 'status', 'agent', 'created_at', 'updated_at',
                            'priority', 'service_responsable', 'is_duplicate']
