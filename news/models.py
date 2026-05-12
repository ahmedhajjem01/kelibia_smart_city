from django.db import models
from django.conf import settings

class Article(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='my_articles'
    )
    title = models.CharField(max_length=255, verbose_name="Titre")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="Slug")
    content = models.TextField(verbose_name="Contenu")
    image = models.TextField(null=True, blank=True, verbose_name="Image de couverture (URL ou Base64)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True, verbose_name="Est publié")

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class ArticleImage(models.Model):
    article = models.ForeignKey(Article, related_name='images', on_delete=models.CASCADE)
    image = models.TextField(verbose_name="Image supplémentaire (URL ou Base64)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.article.title}"
