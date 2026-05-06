from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExtraitMariageViewSet, DemandeMariageViewSet, certificate_view

router = DefaultRouter()
router.register(r'extraits', ExtraitMariageViewSet, basename='extrait-mariage')
router.register(r'demandes', DemandeMariageViewSet, basename='demande-mariage')

urlpatterns = [
    path('<int:pk>/certificate/', certificate_view, {'lang': 'ar'}, name='certificate_ar'),
    path('<int:pk>/certificate/<str:lang>/', certificate_view, name='certificate_lang'),
    path('', include(router.urls)),
]
