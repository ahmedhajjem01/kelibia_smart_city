from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DemandeConstructionViewSet, DemandeGoudronnageViewSet, 
    DemandeCertificatVocationViewSet, DemandeRaccordementViewSet
)

router = DefaultRouter()
router.register(r'demandes', DemandeConstructionViewSet, basename='construction')
router.register(r'goudronnage', DemandeGoudronnageViewSet, basename='goudronnage')
router.register(r'vocation', DemandeCertificatVocationViewSet, basename='vocation')
router.register(r'raccordement', DemandeRaccordementViewSet, basename='raccordement')

urlpatterns = [
    path('', include(router.urls)),
]
