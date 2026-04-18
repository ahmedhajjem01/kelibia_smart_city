from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeCommerceViewSet

router = DefaultRouter()
router.register(r'demande', DemandeCommerceViewSet, basename='demande-commerce')

urlpatterns = [
    path('', include(router.urls)),
]
