from rest_framework import serializers
from .models import DemandeEvenement


class DemandeEvenementSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.get_full_name')
    type_evenement_display = serializers.ReadOnlyField(source='get_type_evenement_display')
    lieu_type_display = serializers.ReadOnlyField(source='get_lieu_type_display')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    conflict_with_title = serializers.SerializerMethodField()

    class Meta:
        model = DemandeEvenement
        fields = [
            'id', 'citizen', 'citizen_name',
            # Event info
            'titre_evenement', 'type_evenement', 'type_evenement_display', 'type_evenement_libre',
            'description', 'nombre_participants',
            # Location
            'lieu_type', 'lieu_type_display', 'lieu_details', 'latitude', 'longitude',
            # Dates
            'date_debut', 'date_fin', 'heure_debut', 'heure_fin',
            # Organizer
            'nom_organisateur', 'cin_organisateur', 'telephone_organisateur', 'association_nom',
            # Documents
            'cin_recto', 'cin_verso', 'plan_lieu', 'programme_evenement',
            'attestation_assurance', 'plan_securite', 'attestation_association',
            # Agent fields
            'status', 'status_display', 'commentaire_agent', 'autorisation_signee', 'is_paid',
            # Conflict
            'has_conflict', 'conflict_with', 'conflict_with_title',
            # Timestamps
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'citizen', 'status', 'commentaire_agent', 'autorisation_signee',
            'is_paid', 'has_conflict', 'conflict_with', 'created_at', 'updated_at',
        ]

    def get_conflict_with_title(self, obj):
        if obj.conflict_with:
            return obj.conflict_with.titre_evenement
        return None

    def create(self, validated_data):
        validated_data['citizen'] = self.context['request'].user
        instance = super().create(validated_data)
        # Run conflict detection after creation
        instance.detect_conflict()
        instance.save(update_fields=['has_conflict', 'conflict_with'])
        return instance


class DemandeEvenementPublicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public event listing (approved events only)."""
    type_evenement_display = serializers.ReadOnlyField(source='get_type_evenement_display')
    lieu_type_display = serializers.ReadOnlyField(source='get_lieu_type_display')

    class Meta:
        model = DemandeEvenement
        fields = [
            'id', 'titre_evenement', 'type_evenement', 'type_evenement_display', 'type_evenement_libre',
            'description', 'nombre_participants',
            'lieu_type', 'lieu_type_display', 'lieu_details', 'latitude', 'longitude',
            'date_debut', 'date_fin', 'heure_debut', 'heure_fin',
            'nom_organisateur', 'association_nom',
        ]
