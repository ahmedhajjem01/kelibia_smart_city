from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, TopicViewSet, ReplyViewSet, NotificationViewSet, ForumStatsView

router = DefaultRouter()
router.register(r'topics',        TopicViewSet,       basename='topic')
router.register(r'replies',       ReplyViewSet,       basename='reply')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'tags',          TagViewSet,          basename='tag')
router.register(r'stats',         ForumStatsView,      basename='forum-stats')

urlpatterns = [
    path('', include(router.urls)),
]
