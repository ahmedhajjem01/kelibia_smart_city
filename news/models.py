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
    image = models.ImageField(upload_to='articles/', null=True, blank=True, verbose_name="Image de couverture")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True, verbose_name="Est publié")

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
