from rest_framework import serializers
from .models import DeclarationDeces, DemandeInhumation, ExtraitDeces
from extrait_naissance.models import Citoyen

class CitoyenSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citoyen
        fields = ['id', 'prenom_fr', 'prenom_ar', 'nom_fr', 'nom_ar', 'cin', 'n_etat_civil']

class DeclarationDecesSerializer(serializers.ModelSerializer):
    defunt_detail = CitoyenSimpleSerializer(source='defunt', read_only=True)
    lieu_deces_fr = serializers.CharField(required=False, allow_blank=True, default='')
    lieu_deces_ar = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = DeclarationDeces
        fields = [
            'id', 'defunt', 'defunt_detail', 'date_deces',
            'lieu_deces_fr', 'lieu_deces_ar', 'police_report',
            'commentaire', 'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']

    def validate(self, attrs):
        from django.utils import timezone
        from datetime import timedelta
        
        date_deces = attrs.get('date_deces')
        if date_deces:
            now = timezone.now()
            # 72 hours = 3 days
            if date_deces > now:
                raise serializers.ValidationError({"date_deces": "La date de décès ne peut pas être dans le futur."})
            if date_deces < now - timedelta(hours=72):
                raise serializers.ValidationError({"date_deces": "Le décès doit être déclaré dans un délai de 72 heures (3 jours)."})

        if not attrs.get('lieu_deces_fr') and not attrs.get('lieu_deces_ar'):
            raise serializers.ValidationError(
                {'lieu_deces_fr': "Veuillez saisir le lieu du décès (en français ou en arabe)."}
            )
        return attrs

class DemandeInhumationSerializer(serializers.ModelSerializer):
    declaration_detail = DeclarationDecesSerializer(source='declaration_deces', read_only=True)
    
    class Meta:
        model = DemandeInhumation
        fields = [
            'id', 'declaration_deces', 'declaration_detail', 
            'cimetiere_fr', 'cimetiere_ar', 'date_souhaitee',
            'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']

class ExtraitDecesSerializer(serializers.ModelSerializer):
    nom_complet_fr = serializers.SerializerMethodField()
    nom_complet_ar = serializers.SerializerMethodField()
    url_fr = serializers.SerializerMethodField()
    url_ar = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model = ExtraitDeces
        fields = [
            'id', 'numero_registre', 'annee_acte', 'date_deces',
            'nom_complet_fr', 'nom_complet_ar', 'url_fr', 'url_ar', 'is_paid'
        ]

    def get_nom_complet_fr(self, obj):
        return f"{obj.defunt.prenom_fr} {obj.defunt.nom_fr}"

    def get_nom_complet_ar(self, obj):
        return f"{obj.defunt.prenom_ar} {obj.defunt.nom_ar}"

    def get_url_fr(self, obj):
        return f"/extrait-deces/{obj.id}/certificate/fr/"

    def get_url_ar(self, obj):
        return f"/extrait-deces/{obj.id}/certificate/"

    def get_is_paid(self, obj):
        from django.utils import timezone
        request = self.context.get('request')
        if request and request.user and getattr(request.user, 'has_active_asd', False):
            return True
        if obj.is_paid and obj.paid_at:
            diff = timezone.now() - obj.paid_at
            return diff.total_seconds() < 86400
        return False
