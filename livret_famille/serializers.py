from rest_framework import serializers
from .models import DemandeLivretFamille

class DemandeLivretFamilleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'commentaire_agent', 'issued_document']

class DemandeLivretFamilleAgentSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
