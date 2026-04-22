from rest_framework import serializers
from .models import DemandeConstruction, DemandeGoudronnage, DemandeCertificatVocation, DemandeRaccordement


class DemandeConstructionSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    citizen_email = serializers.SerializerMethodField()
    type_travaux_display = serializers.CharField(source='get_type_travaux_display', read_only=True)
    usage_batiment_display = serializers.CharField(source='get_usage_batiment_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)

    class Meta:
        model = DemandeConstruction
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'priorite', 'commentaire_agent',
                            'permis_signe', 'is_paid', 'paid_at', 'is_high_risk', 'created_at', 'updated_at']

    def get_citizen_name(self, obj):
        return f"{obj.citizen.first_name} {obj.citizen.last_name}".strip() or obj.citizen.email

    def get_citizen_email(self, obj):
        return obj.citizen.email

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.compute_risk()
        return instance


class DemandeGoudronnageSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    citizen_email = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DemandeGoudronnage
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'is_paid', 'paid_at', 'commentaire_agent', 'created_at', 'updated_at']

    def get_citizen_name(self, obj):
        return f"{obj.citizen.first_name} {obj.citizen.last_name}".strip() or obj.citizen.email

    def get_citizen_email(self, obj):
        return obj.citizen.email


class DemandeCertificatVocationSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    citizen_email = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DemandeCertificatVocation
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'is_paid', 'paid_at', 'commentaire_agent', 'certificat_signe', 'created_at', 'updated_at']

    def get_citizen_name(self, obj):
        return f"{obj.citizen.first_name} {obj.citizen.last_name}".strip() or obj.citizen.email

    def get_citizen_email(self, obj):
        return obj.citizen.email


class DemandeRaccordementSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    citizen_email = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_reseau_display = serializers.CharField(source='get_type_reseau_display', read_only=True)

    class Meta:
        model = DemandeRaccordement
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'is_paid', 'paid_at', 'devis_montant', 'devis_pdf', 'date_visite', 'commentaire_agent', 'created_at', 'updated_at']

    def get_citizen_name(self, obj):
        return f"{obj.citizen.first_name} {obj.citizen.last_name}".strip() or obj.citizen.email

    def get_citizen_email(self, obj):
        return obj.citizen.email
