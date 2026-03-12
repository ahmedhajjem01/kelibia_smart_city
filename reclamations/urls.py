from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReclamationViewSet

router = DefaultRouter()
router.register(r'', ReclamationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
