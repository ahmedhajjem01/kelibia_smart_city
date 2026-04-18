from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeImpotViewSet

router = DefaultRouter()
router.register(r'demande', DemandeImpotViewSet, basename='demande-impot')

urlpatterns = [
    path('', include(router.urls)),
]
