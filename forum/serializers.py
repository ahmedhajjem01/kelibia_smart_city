from rest_framework import serializers
from .models import Tag, Topic, Reply, Vote, Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'user_type']


class ReplySerializer(serializers.ModelSerializer):
    author      = AuthorSerializer(read_only=True)
    votes_count = serializers.IntegerField(read_only=True)
    has_voted   = serializers.SerializerMethodField()

    class Meta:
        model  = Reply
        fields = ['id', 'content', 'author', 'created_at', 'votes_count', 'has_voted']

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, reply=obj).exists()
        return False


class TopicListSerializer(serializers.ModelSerializer):
    author        = AuthorSerializer(read_only=True)
    tags          = TagSerializer(many=True, read_only=True)
    replies_count = serializers.IntegerField(read_only=True)
    votes_count   = serializers.IntegerField(read_only=True)
    has_voted     = serializers.SerializerMethodField()

    class Meta:
        model  = Topic
        fields = [
            'id', 'title', 'category', 'author', 'tags',
            'is_pinned', 'is_resolved', 'views',
            'replies_count', 'votes_count', 'has_voted',
            'created_at', 'updated_at',
        ]

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Vote.objects.filter(user=request.user, topic=obj).exists()
        return False


class TopicDetailSerializer(TopicListSerializer):
    replies = ReplySerializer(many=True, read_only=True)

    class Meta(TopicListSerializer.Meta):
        fields = TopicListSerializer.Meta.fields + ['content', 'replies']


class TopicCreateSerializer(serializers.ModelSerializer):
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True, required=False, default=[]
    )

    class Meta:
        model  = Topic
        fields = ['title', 'content', 'category', 'tag_names']

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        topic = Topic.objects.create(**validated_data)
        for name in tag_names:
            name = name.strip().lower()
            if name:
                tag, _ = Tag.objects.get_or_create(name=name)
                topic.tags.add(tag)
        return topic


class NotificationSerializer(serializers.ModelSerializer):
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    reply_author = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = ['id', 'topic', 'topic_title', 'reply', 'reply_author', 'is_read', 'created_at']

    def get_reply_author(self, obj):
        if obj.reply:
            u = obj.reply.author
            return f"{u.first_name} {u.last_name}".strip() or u.email
        return None
