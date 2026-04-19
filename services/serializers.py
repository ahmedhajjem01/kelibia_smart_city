from rest_framework import serializers
from .models import Category, Service, Requirement

class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = ['id', 'name_fr', 'name_ar', 'is_mandatory']

class ServiceSerializer(serializers.ModelSerializer):
    requirements = RequirementSerializer(many=True, required=False)
    availability = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'category', 'name_fr', 'name_ar', 'description_fr', 'description_ar', 'processing_time_fr', 'processing_time_ar', 'form_pdf_ar', 'form_pdf_fr', 'requirements', 'availability']

    def create(self, validated_data):
        requirements_data = validated_data.pop('requirements', [])
        service = Service.objects.create(**validated_data)
        for req_data in requirements_data:
            Requirement.objects.create(service=service, **req_data)
        return service

    def update(self, instance, validated_data):
        requirements_data = validated_data.pop('requirements', None)
        instance = super().update(instance, validated_data)
        
        if requirements_data is not None:
            # Clear old requirements and create new ones
            instance.requirements.all().delete()
            for req_data in requirements_data:
                Requirement.objects.create(service=instance, **req_data)
        return instance

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
