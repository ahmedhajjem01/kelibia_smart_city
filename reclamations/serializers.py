from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import Reclamation
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point

User = get_user_model()


class ReclamationSerializer(serializers.ModelSerializer):
    """
    Serializer standard — retourne JSON plat avec latitude/longitude séparés.
    Utilisé pour les listes, créations et mises à jour.
    """
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    agent_name   = serializers.ReadOnlyField(source='agent.get_full_name')

    # Champs virtuels pour recevoir lat/lng depuis le frontend
    latitude  = serializers.FloatField(write_only=True, required=False, allow_null=True)
    longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model  = Reclamation
        fields = [
            'id', 'citizen', 'citizen_name', 'agent', 'agent_name',
            'title', 'description', 'category', 'status',
            'priority', 'service_responsable', 'is_duplicate',
            'image',
            'latitude', 'longitude',   # write-only : reçus depuis le frontend
            'created_at', 'updated_at',
        ]
        read_only_fields = ['citizen', 'status', 'agent', 'created_at', 'updated_at',
                            'priority', 'service_responsable', 'is_duplicate']

    def to_representation(self, instance):
        """Ajoute latitude/longitude dans la réponse en lisant le PointField."""
        data = super().to_representation(instance)
        if instance.location:
            data['longitude'] = instance.location.x
            data['latitude']  = instance.location.y
        else:
            data['longitude'] = None
            data['latitude']  = None
        return data

    def create(self, validated_data):
        lat = validated_data.pop('latitude', None)
        lng = validated_data.pop('longitude', None)
        if lat is not None and lng is not None:
            validated_data['location'] = Point(float(lng), float(lat), srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop('latitude', None)
        lng = validated_data.pop('longitude', None)
        if lat is not None and lng is not None:
            validated_data['location'] = Point(float(lng), float(lat), srid=4326)
        return super().update(instance, validated_data)


class ReclamationGeoSerializer(GeoFeatureModelSerializer):
    """
    Serializer GeoJSON — retourne un FeatureCollection pour Leaflet.
    Utilisé sur l'endpoint /api/reclamations/geojson/
    """
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')

    class Meta:
        model          = Reclamation
        geo_field      = 'location'
        fields = [
            'id', 'citizen_name',
            'title', 'description', 'category', 'status',
            'priority', 'service_responsable', 'is_duplicate',
            'image', 'created_at',
        ]

