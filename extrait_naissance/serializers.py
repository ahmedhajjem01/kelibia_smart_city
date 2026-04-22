from .models import DeclarationNaissance, Citoyen, ExtraitNaissance, DemandeLegalisation

class DemandeLegalisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeLegalisation
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'created_at', 'is_paid']

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

    def validate(self, attrs):
        from django.utils import timezone
        from datetime import timedelta
        
        date_naissance = attrs.get('date_naissance')
        if date_naissance:
            now = timezone.now()
            # 10 days
            if date_naissance > now:
                raise serializers.ValidationError({"date_naissance": "La date de naissance ne peut pas être dans le futur."})
            if date_naissance < now - timedelta(days=10):
                raise serializers.ValidationError({"date_naissance": "La naissance doit être déclarée dans un délai de 10 jours légal."})
        return attrs
