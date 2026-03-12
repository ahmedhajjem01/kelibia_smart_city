from rest_framework import serializers
from .models import Article

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Article
        fields = ['id', 'author', 'author_name', 'title', 'slug', 'content', 'image', 'created_at', 'updated_at', 'is_published']
        read_only_fields = ['author', 'slug', 'created_at', 'updated_at']
