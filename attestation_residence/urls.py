from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeResidenceViewSet

router = DefaultRouter()
router.register(r'demande', DemandeResidenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
