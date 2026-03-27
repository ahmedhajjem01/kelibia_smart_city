from rest_framework import serializers
from .models import DemandeMariage, ExtraitMariage

class ExtraitMariageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtraitMariage
        fields = '__all__'

class DemandeMariageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeMariage
        fields = '__all__'
        read_only_fields = ('citizen', 'status', 'commentaire_agent', 'created_at', 'updated_at')
