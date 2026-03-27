from rest_framework import serializers
from .models import DeclarationNaissance, Citoyen, ExtraitNaissance

class DeclarationNaissanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeclarationNaissance
        fields = [
            'id', 'prenom_fr', 'prenom_ar', 'nom_fr', 'nom_ar', 
            'date_naissance', 'lieu_naissance_fr', 'lieu_naissance_ar',
            'sexe', 'cin_pere', 'cin_mere', 'commentaire', 
            'attachment', 'cin_pere_scan', 'cin_mere_scan', 'signature_declarant',
            'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']
