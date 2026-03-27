from rest_framework import serializers
from .models import DeclarationDeces
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
