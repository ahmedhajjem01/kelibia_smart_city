from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Tag, Topic, Reply, Vote, Notification
from .serializers import (
    TagSerializer, TopicListSerializer, TopicDetailSerializer,
    TopicCreateSerializer, ReplySerializer, NotificationSerializer
)
from .permissions import IsAgentOrAdmin

User = get_user_model()


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]


class TopicViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Topic.objects.prefetch_related('tags', 'replies', 'votes').select_related('author')
        category = self.request.query_params.get('category')
        tag      = self.request.query_params.get('tag')
        search   = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if tag:
            qs = qs.filter(tags__name__icontains=tag)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(content__icontains=search))
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return TopicCreateSerializer
        if self.action == 'retrieve':
            return TopicDetailSerializer
        return TopicListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment views
        Topic.objects.filter(pk=instance.pk).update(views=instance.views + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not (request.user.is_staff or request.user.user_type == 'agent'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    # POST /api/forum/topics/{id}/reply/
    @action(detail=True, methods=['post'], url_path='reply')
    def add_reply(self, request, pk=None):
        topic = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'detail': 'Content required.'}, status=status.HTTP_400_BAD_REQUEST)
        reply = Reply.objects.create(topic=topic, author=request.user, content=content)
        return Response(ReplySerializer(reply, context={'request': request}).data, status=status.HTTP_201_CREATED)

    # POST /api/forum/topics/{id}/vote/  — toggle
    @action(detail=True, methods=['post'], url_path='vote')
    def vote_topic(self, request, pk=None):
        topic = self.get_object()
        vote, created = Vote.objects.get_or_create(user=request.user, topic=topic)
        if not created:
            vote.delete()
            return Response({'voted': False, 'votes_count': topic.votes_count})
        return Response({'voted': True, 'votes_count': topic.votes_count})

    # POST /api/forum/topics/{id}/pin/  — agent/admin only
    @action(detail=True, methods=['post'], url_path='pin', permission_classes=[IsAuthenticated, IsAgentOrAdmin])
    def pin_topic(self, request, pk=None):
        topic = self.get_object()
        topic.is_pinned = not topic.is_pinned
        topic.save(update_fields=['is_pinned'])
        return Response({'is_pinned': topic.is_pinned})

    # POST /api/forum/topics/{id}/resolve/  — agent/admin only
    @action(detail=True, methods=['post'], url_path='resolve', permission_classes=[IsAuthenticated, IsAgentOrAdmin])
    def resolve_topic(self, request, pk=None):
        topic = self.get_object()
        topic.is_resolved = not topic.is_resolved
        topic.save(update_fields=['is_resolved'])
        return Response({'is_resolved': topic.is_resolved})


class ReplyViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Reply.objects.all()

    # POST /api/forum/replies/{id}/vote/  — toggle
    @action(detail=True, methods=['post'], url_path='vote')
    def vote_reply(self, request, pk=None):
        reply = self.get_object()
        vote, created = Vote.objects.get_or_create(user=request.user, reply=reply)
        if not created:
            vote.delete()
            return Response({'voted': False, 'votes_count': reply.votes_count})
        return Response({'voted': True, 'votes_count': reply.votes_count})

    # DELETE /api/forum/replies/{id}/
    def destroy(self, request, pk=None):
        reply = self.get_object()
        if not (request.user.is_staff or request.user.user_type == 'agent' or reply.author == request.user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        reply.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def list(self, request):
        qs = self.get_queryset()
        return Response(NotificationSerializer(qs, many=True).data)

    # POST /api/forum/notifications/read/
    @action(detail=False, methods=['post'], url_path='read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'ok'})


class ForumStatsView(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='')
    def stats(self, request):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=30)
        active_members = User.objects.filter(
            Q(forum_topics__created_at__gte=cutoff) |
            Q(forum_replies__created_at__gte=cutoff)
        ).distinct().count()
        return Response({
            'total_topics':  Topic.objects.count(),
            'total_replies': Reply.objects.count(),
            'active_members': active_members,
            'pinned_topics': Topic.objects.filter(is_pinned=True).count(),
            'resolved_topics': Topic.objects.filter(is_resolved=True).count(),
        })
