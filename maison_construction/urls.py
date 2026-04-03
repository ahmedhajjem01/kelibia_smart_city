from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeConstructionViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeConstructionViewSet, basename='construction')

urlpatterns = [
    path('', include(router.urls)),
]
