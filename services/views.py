from rest_framework import viewsets, permissions
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer

class IsSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', '') == 'supervisor')

from rest_framework.decorators import action
from rest_framework.response import Response
from googletrans import Translator
import logging
logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().prefetch_related('services__requirements')
    serializer_class = CategorySerializer
    permission_classes = [IsSupervisorOrReadOnly]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsSupervisorOrReadOnly]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def translate(self, request):
        text = request.data.get('text')
        if not text:
            return Response({'error': 'No text provided'}, status=400)
        try:
            translator = Translator()
            result = translator.translate(text, src='fr', dest='ar')
            return Response({'translated': result.text})
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return Response({'error': str(e)}, status=500)
