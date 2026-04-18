from rest_framework import viewsets, permissions
from .models import Article
from .serializers import ArticleSerializer
from django.utils.text import slugify

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(is_published=True)
    serializer_class = ArticleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        # Allow Agents and Supervisors to manage news
        if self.request.user.is_authenticated and self.request.user.user_type in ['agent', 'supervisor']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        title = self.request.data.get('title')
        slug = slugify(title)
        # Handle slug collisions
        if Article.objects.filter(slug=slug).exists():
            import time
            slug = f"{slug}-{int(time.time())}"
        serializer.save(author=self.request.user, slug=slug)
