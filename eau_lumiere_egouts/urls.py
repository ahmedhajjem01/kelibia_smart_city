from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeEauViewSet

router = DefaultRouter()
router.register(r'demande', DemandeEauViewSet, basename='demande-eau')

urlpatterns = [
    path('', include(router.urls)),
]
