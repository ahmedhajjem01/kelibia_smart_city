from rest_framework import viewsets, permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.request import Request
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer


class OptionalJWTAuthentication(JWTAuthentication):
    """
    Like JWTAuthentication but treats expired/invalid tokens as anonymous
    instead of raising 401. This allows public read endpoints to work even
    when the browser sends an expired JWT token.
    """
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None


class IsSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor')


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().prefetch_related('services__requirements')
    serializer_class = CategorySerializer
    permission_classes = [IsSupervisorOrReadOnly]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsSupervisorOrReadOnly]
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]
