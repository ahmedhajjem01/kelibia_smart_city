from rest_framework import serializers
from .models import Category, Service, Requirement

class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = ['id', 'name_fr', 'name_ar', 'is_mandatory']

class ServiceSerializer(serializers.ModelSerializer):
    requirements = RequirementSerializer(many=True, read_only=True)
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = ['id', 'name_fr', 'name_ar', 'description_fr', 'description_ar', 'processing_time', 'form_pdf_ar', 'form_pdf_fr', 'requirements', 'availability']

    def get_availability(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {"is_available": True, "reason_fr": "", "reason_ar": ""}

        name_lower = obj.name_fr.lower() if hasattr(obj.name_fr, 'lower') else obj.name_fr
        name_ar = obj.name_ar

        # Logic for Marriage Contract filtering
        if "mariage" in name_lower or "زواج" in name_ar:
            from extrait_mariage.models import ExtraitMariage
            from extrait_naissance.models import Citoyen
            from django.db import models # Import models for Q object
            
            user_cin = getattr(request.user, 'cin', None)
            if user_cin:
                try:
                    citoyen = Citoyen.objects.get(cin=user_cin)
                    # Check if already married in the system
                    already_married = ExtraitMariage.objects.filter(
                        models.Q(epoux=citoyen) | models.Q(epouse=citoyen)
                    ).exists()
                    # For simplicity, we assume one active marriage = married. 
                    # If divorce is implemented, we'd check for it here.
                    if already_married:
                        return {
                            "is_available": False,
                            "reason_fr": "Vous êtes déjà enregistré(e) comme étant marié(e).",
                            "reason_ar": "أنت مسجل بالفعل كمتزوج(ة)."
                        }
                except Citoyen.DoesNotExist:
                    pass

        return {"is_available": True, "reason_fr": "", "reason_ar": ""}

class CategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name_fr', 'name_ar', 'icon', 'services']
