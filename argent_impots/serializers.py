from rest_framework import serializers
from .models import DemandeImpot


class DemandeImpotSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    citizen_email = serializers.ReadOnlyField(source='citizen.email')
    service_type_label = serializers.ReadOnlyField(source='get_service_type_display')

    class Meta:
        model = DemandeImpot
        fields = [
            'id', 'citizen', 'citizen_name', 'citizen_email',
            'service_type', 'service_type_label',
            'adresse_bien', 'description',
            'cin_recto', 'cin_verso', 'document_propriete',
            'status', 'is_paid', 'commentaire_agent', 'issued_document',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['citizen', 'status', 'is_paid', 'commentaire_agent', 'issued_document', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['citizen'] = self.context['request'].user
        return super().create(validated_data)
