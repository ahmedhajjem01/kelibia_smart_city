from rest_framework import serializers
from .models import DeclarationDeces
from extrait_naissance.models import Citoyen

class CitoyenSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citoyen
        fields = ['id', 'prenom_fr', 'prenom_ar', 'nom_fr', 'nom_ar', 'cin', 'n_etat_civil']

class DeclarationDecesSerializer(serializers.ModelSerializer):
    defunt_detail = CitoyenSimpleSerializer(source='defunt', read_only=True)
    
    class Meta:
        model = DeclarationDeces
        fields = [
            'id', 'defunt', 'defunt_detail', 'date_deces', 
            'lieu_deces_fr', 'lieu_deces_ar', 'police_report',
            'commentaire', 'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']
