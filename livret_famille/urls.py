from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeLivretFamilleViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeLivretFamilleViewSet, basename='demande-livret-famille')
urlpatterns = [path('', include(router.urls))]
