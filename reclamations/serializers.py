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
    citizen_name      = serializers.SerializerMethodField()
    agent_name        = serializers.SerializerMethodField()
    confidence        = serializers.SerializerMethodField()
    duplicate_of_id   = serializers.SerializerMethodField()
    duplicate_of_title = serializers.SerializerMethodField()

    def get_citizen_name(self, obj):
        name = obj.citizen.get_full_name().strip() if obj.citizen else ''
        return name if name else (obj.citizen.email if obj.citizen else '—')

    def get_agent_name(self, obj):
        if not obj.agent:
            return None
        name = obj.agent.get_full_name().strip()
        return name if name else obj.agent.email

    def get_duplicate_of_id(self, obj):
        return obj.duplicate_of.id if obj.duplicate_of else None

    def get_duplicate_of_title(self, obj):
        return obj.duplicate_of.title if obj.duplicate_of else None

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
            'priority', 'service_responsable',
            'is_duplicate', 'duplicate_of_id', 'duplicate_of_title', 'similarity_score',
            'image',
            'latitude', 'longitude',
            'created_at', 'updated_at',
            'confidence',
        ]
        read_only_fields = ['citizen', 'status', 'agent', 'created_at', 'updated_at',
                            'priority', 'service_responsable',
                            'is_duplicate', 'similarity_score']


class ReclamationGeoJSONSerializer(serializers.BaseSerializer):
    """
    Sérialise une Reclamation comme GeoJSON Feature (RFC 7946).
    geometry: Point [longitude, latitude] — null si coordonnées manquantes.
    N'appelle pas le classifieur ML (trop lent pour un export en masse).
    """

    def to_representation(self, instance):
        if instance.latitude is not None and instance.longitude is not None:
            geometry = {
                "type": "Point",
                "coordinates": [instance.longitude, instance.latitude],  # RFC 7946: lon, lat
            }
        else:
            geometry = None

        try:
            cname = instance.citizen.get_full_name().strip()
            citizen_name = cname if cname else instance.citizen.email
        except Exception:
            citizen_name = None

        return {
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "id":                  instance.id,
                "title":               instance.title,
                "description":         instance.description,
                "category":            instance.category,
                "status":              instance.status,
                "priority":            instance.priority,
                "service_responsable": instance.service_responsable,
                "is_duplicate":        instance.is_duplicate,
                "created_at":          instance.created_at.isoformat(),
                "updated_at":          instance.updated_at.isoformat(),
                "citizen_name":        citizen_name,
            },
        }
