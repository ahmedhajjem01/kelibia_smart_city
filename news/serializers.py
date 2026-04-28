from rest_framework import serializers
from .models import Article, ArticleImage

class ArticleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleImage
        fields = ['id', 'image']

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    images = ArticleImageSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'author', 'author_name', 'title', 'slug', 'content', 'image', 'images', 'created_at', 'updated_at', 'is_published']
        read_only_fields = ['author', 'slug', 'created_at', 'updated_at']
