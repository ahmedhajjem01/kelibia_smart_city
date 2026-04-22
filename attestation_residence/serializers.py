from rest_framework import serializers
from .models import DemandeResidence

class DemandeResidenceSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    
    class Meta:
        model = DemandeResidence
        fields = [
            'id', 'citizen', 'citizen_name', 'profession', 'cin', 'telephone',
            'adresse_demandee', 'motif_demande',
            'cin_recto', 'cin_verso', 'cin_copy', 
            'quitus_municipal', 'acte_deces_conjoint',
            'status', 'is_paid', 'issued_document', 'commentaire_agent',
            'created_at', 'updated_at'
        ]

        read_only_fields = ['citizen', 'status', 'issued_document', 'commentaire_agent', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['citizen'] = user
        return super().create(validated_data)
