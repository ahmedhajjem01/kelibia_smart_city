import os
files = {
  'livret_famille/models.py': '''
from django.db import models
from django.conf import settings

class DemandeLivretFamille(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]

    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='demandes_livret')
    
    nom_chef_famille = models.CharField(max_length=100, verbose_name='Nom du chef de famille')
    prenom_chef_famille = models.CharField(max_length=100, verbose_name='Prénom du chef de famille')
    motif_demande = models.CharField(max_length=50, choices=[
        ('premier_livret', 'Premier livret'),
        ('renouvellement', 'Renouvellement'),
        ('duplicata', 'Duplicata / Nègre')
    ], default='premier_livret', verbose_name='Motif de la demande')

    photo_chef_famille = models.ImageField(upload_to='declarations/livret/photos/', null=True, blank=True, verbose_name='Photo du chef de famille (facultative)')
    extrait_mariage = models.FileField(upload_to='declarations/livret/mariage/')
    extrait_naissance_epoux1 = models.FileField(upload_to='declarations/livret/naissance_1/')
    extrait_naissance_epoux2 = models.FileField(upload_to='declarations/livret/naissance_2/')
    extraits_enfants = models.FileField(upload_to='declarations/livret/enfants/', null=True, blank=True)
    extrait_deces_epoux = models.FileField(upload_to='declarations/livret/deces_epoux/', null=True, blank=True)
    jugement_divorce = models.FileField(upload_to='declarations/livret/divorce/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    commentaire_agent = models.TextField(blank=True, verbose_name='Commentaire de agent')
    issued_document = models.FileField(upload_to='certificates/livret/issued/', null=True, blank=True, verbose_name='Livret prêt ou Quittance')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Demande de Livret de Famille'
        verbose_name_plural = 'Demandes de Livret de Famille'
        ordering = ['-created_at']

    def __str__(self):
        return f'Demande Livret de Famille - {self.nom_chef_famille} {self.prenom_chef_famille} - {self.status}'
''',
  'livret_famille/serializers.py': '''
from rest_framework import serializers
from .models import DemandeLivretFamille

class DemandeLivretFamilleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'commentaire_agent', 'issued_document']

class DemandeLivretFamilleAgentSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
''',
  'livret_famille/views.py': '''
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeLivretFamille
from .serializers import DemandeLivretFamilleSerializer, DemandeLivretFamilleAgentSerializer

class DemandeLivretFamilleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamille.objects.all().order_by('-created_at')
        return DemandeLivretFamille.objects.filter(citizen=user).order_by('-created_at')
    def get_serializer_class(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamilleAgentSerializer
        return DemandeLivretFamilleSerializer
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
''',
  'livret_famille/urls.py': '''
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeLivretFamilleViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeLivretFamilleViewSet, basename='demande-livret-famille')
urlpatterns = [path('', include(router.urls))]
''',
}
import os
files = {
  'livret_famille/models.py': '''
from django.db import models
from django.conf import settings

class DemandeLivretFamille(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]

    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='demandes_livret')
    
    nom_chef_famille = models.CharField(max_length=100, verbose_name='Nom du chef de famille')
    prenom_chef_famille = models.CharField(max_length=100, verbose_name='Prénom du chef de famille')
    motif_demande = models.CharField(max_length=50, choices=[
        ('premier_livret', 'Premier livret'),
        ('renouvellement', 'Renouvellement'),
        ('duplicata', 'Duplicata / Nègre')
    ], default='premier_livret', verbose_name='Motif de la demande')

    photo_chef_famille = models.ImageField(upload_to='declarations/livret/photos/', null=True, blank=True, verbose_name='Photo du chef de famille (facultative)')
    extrait_mariage = models.FileField(upload_to='declarations/livret/mariage/')
    extrait_naissance_epoux1 = models.FileField(upload_to='declarations/livret/naissance_1/')
    extrait_naissance_epoux2 = models.FileField(upload_to='declarations/livret/naissance_2/')
    extraits_enfants = models.FileField(upload_to='declarations/livret/enfants/', null=True, blank=True)
    extrait_deces_epoux = models.FileField(upload_to='declarations/livret/deces_epoux/', null=True, blank=True)
    jugement_divorce = models.FileField(upload_to='declarations/livret/divorce/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    commentaire_agent = models.TextField(blank=True, verbose_name='Commentaire de agent')
    issued_document = models.FileField(upload_to='certificates/livret/issued/', null=True, blank=True, verbose_name='Livret prêt ou Quittance')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Demande de Livret de Famille'
        verbose_name_plural = 'Demandes de Livret de Famille'
        ordering = ['-created_at']

    def __str__(self):
        return f'Demande Livret de Famille - {self.nom_chef_famille} {self.prenom_chef_famille} - {self.status}'
''',
  'livret_famille/serializers.py': '''
from rest_framework import serializers
from .models import DemandeLivretFamille

class DemandeLivretFamilleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'commentaire_agent', 'issued_document']

class DemandeLivretFamilleAgentSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    class Meta:
        model = DemandeLivretFamille
        fields = '__all__'
''',
  'livret_famille/views.py': '''
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DemandeLivretFamille
from .serializers import DemandeLivretFamilleSerializer, DemandeLivretFamilleAgentSerializer

class DemandeLivretFamilleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamille.objects.all().order_by('-created_at')
        return DemandeLivretFamille.objects.filter(citizen=user).order_by('-created_at')
    def get_serializer_class(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            return DemandeLivretFamilleAgentSerializer
        return DemandeLivretFamilleSerializer
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'agent':
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
''',
  'livret_famille/urls.py': '''
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeLivretFamilleViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeLivretFamilleViewSet, basename='demande-livret-famille')
urlpatterns = [path('', include(router.urls))]
''',
}
for fp, content in files.items():
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

with open('core/settings.py', 'r', encoding='utf-8') as f: content = f.read()
if 'livret_famille' not in content:
    content = content.replace(
        "'signalement',",
        "'signalement',\n    'livret_famille',"
    )
    with open('core/settings.py', 'w', encoding='utf-8') as f: f.write(content)

    with open('core/urls.py', 'w', encoding='utf-8') as f: 
        content = content.replace("]","    path('livret-famille/', include('livret_famille.urls')),\n]")
        f.write(content)
