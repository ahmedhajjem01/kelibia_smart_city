from rest_framework import viewsets, permissions
from .models import Article, ArticleImage
from .serializers import ArticleSerializer
from django.utils.text import slugify

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all() # Change to show all in admin, filter in list if needed
    serializer_class = ArticleSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.user_type in ['agent', 'supervisor']:
            return Article.objects.all()
        return Article.objects.filter(is_published=True)

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
        
        article = serializer.save(author=self.request.user, slug=slug)
        
        # Handle multiple images
        extra_images = self.request.FILES.getlist('extra_images')
        for img in extra_images:
            ArticleImage.objects.create(article=article, image=img)

    def perform_update(self, serializer):
        article = serializer.save()
        extra_images = self.request.FILES.getlist('extra_images')
        for img in extra_images:
            ArticleImage.objects.create(article=article, image=img)
