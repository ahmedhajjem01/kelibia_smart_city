from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExtraitMariageViewSet, DemandeMariageViewSet

router = DefaultRouter()
router.register(r'extraits', ExtraitMariageViewSet, basename='extrait-mariage')
router.register(r'demandes', DemandeMariageViewSet, basename='demande-mariage')

urlpatterns = [
    path('', include(router.urls)),
]
