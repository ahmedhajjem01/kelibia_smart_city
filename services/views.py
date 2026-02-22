from rest_framework import generics
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().prefetch_related('services__requirements')
    serializer_class = CategorySerializer

class ServiceDetailView(generics.RetrieveAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
