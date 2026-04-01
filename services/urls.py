from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ServiceViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('list', ServiceViewSet, basename='service') # Changed to /list/ to match common CRUD patterns or keep /services/

urlpatterns = [
    path('', include(router.urls)),
]
