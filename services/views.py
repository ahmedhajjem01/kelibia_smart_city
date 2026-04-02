from rest_framework import viewsets, permissions
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer

class IsSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor')

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().prefetch_related('services__requirements')
    serializer_class = CategorySerializer
    permission_classes = [IsSupervisorOrReadOnly]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsSupervisorOrReadOnly]
