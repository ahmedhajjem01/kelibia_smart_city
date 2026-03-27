from rest_framework import serializers
from .models import DemandeMariage, ExtraitMariage

class ExtraitMariageSerializer(serializers.ModelSerializer):
    conjoint_fr = serializers.SerializerMethodField()
    conjoint_ar = serializers.SerializerMethodField()
    url_fr = serializers.SerializerMethodField()
    url_ar = serializers.SerializerMethodField()

    class Meta:
        model = ExtraitMariage
        fields = [
            'id', 'numero_registre', 'annee_acte', 'date_mariage',
            'conjoint_fr', 'conjoint_ar', 'url_fr', 'url_ar'
        ]

    def get_conjoint_fr(self, obj):
        request = self.context.get('request')
        if not request or not request.user.cin:
            return f"{obj.epouse.prenom_fr} {obj.epouse.nom_fr}"
        
        # If user is the husband, conjoint is the wife, and vice versa
        if obj.epoux.cin == request.user.cin:
            return f"{obj.epouse.prenom_fr} {obj.epouse.nom_fr}"
        return f"{obj.epoux.prenom_fr} {obj.epoux.nom_fr}"

    def get_conjoint_ar(self, obj):
        request = self.context.get('request')
        if not request or not request.user.cin:
            return f"{obj.epouse.prenom_ar} {obj.epouse.nom_ar}"
            
        if obj.epoux.cin == request.user.cin:
            return f"{obj.epouse.prenom_ar} {obj.epouse.nom_ar}"
        return f"{obj.epoux.prenom_ar} {obj.epoux.nom_ar}"

    def get_url_fr(self, obj):
        return f"/extrait-mariage/{obj.id}/certificate/fr/"

    def get_url_ar(self, obj):
        return f"/extrait-mariage/{obj.id}/certificate/"

class DemandeMariageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeMariage
        fields = '__all__'
        read_only_fields = ('citizen', 'status', 'commentaire_agent', 'created_at', 'updated_at')
