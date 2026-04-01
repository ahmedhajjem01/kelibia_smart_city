from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeEvenementViewSet, EvenementsPublicsViewSet

router = DefaultRouter()
router.register(r'demande', DemandeEvenementViewSet, basename='demande-evenement')
router.register(r'publics', EvenementsPublicsViewSet, basename='evenements-publics')

urlpatterns = [
    path('', include(router.urls)),
]
