from rest_framework import serializers
from .models import Category, Service, Requirement

class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = ['id', 'name_fr', 'name_ar', 'is_mandatory']

class ServiceSerializer(serializers.ModelSerializer):
    requirements = RequirementSerializer(many=True, read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'name_fr', 'name_ar', 'description_fr', 'description_ar', 'processing_time', 'requirements']

class CategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name_fr', 'name_ar', 'icon', 'services']
