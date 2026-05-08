from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Article, ArticleImage
from .serializers import ArticleSerializer
from django.utils.text import slugify
from core.permissions import is_supervisor, is_agent, is_agent_for_service


class ArticleViewSet(viewsets.ModelViewSet):
    """
    Access rules:
    - Anyone (unauthenticated): read published articles only
    - citizen: read published articles only
    - agent (news_editor): full CRUD on all articles
    - supervisor: read all articles including drafts, no write access
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    NEWS_SERVICE = 'news_editor'

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (is_supervisor(user) or is_agent_for_service(user, self.NEWS_SERVICE)):
            return Article.objects.all()
        return Article.objects.filter(is_published=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def _check_write_permission(self, request):
        user = request.user
        if is_supervisor(user) and not user.is_staff:
            return Response(
                {"error": "Les superviseurs ne peuvent pas publier d'actualites. Role: observateur uniquement."},
                status=status.HTTP_403_FORBIDDEN
            )
        if not (user.is_staff or is_agent_for_service(user, self.NEWS_SERVICE)):
            return Response(
                {"error": "Acces refuse. Seul l'agent Redacteur d'Actualites peut gerer les articles."},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    def create(self, request, *args, **kwargs):
        err = self._check_write_permission(request)
        if err:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        err = self._check_write_permission(request)
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self._check_write_permission(request)
        if err:
            return err
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        title = self.request.data.get('title')
        slug = slugify(title)
        if Article.objects.filter(slug=slug).exists():
            import time
            slug = f"{slug}-{int(time.time())}"
        article = serializer.save(author=self.request.user, slug=slug)
        extra_images = self.request.FILES.getlist('extra_images')
        for img in extra_images:
            ArticleImage.objects.create(article=article, image=img)

    def perform_update(self, serializer):
        article = serializer.save()
        extra_images = self.request.FILES.getlist('extra_images')
        for img in extra_images:
            ArticleImage.objects.create(article=article, image=img)
