from django.contrib import admin
from .models import Tag, Topic, Reply, Vote, Notification


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'is_pinned', 'is_resolved', 'views', 'created_at']
    list_filter = ['category', 'is_pinned', 'is_resolved']
    search_fields = ['title', 'content']
    filter_horizontal = ['tags']


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ['topic', 'author', 'created_at']
    search_fields = ['content']


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'topic', 'reply']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'topic', 'is_read', 'created_at']
    list_filter = ['is_read']
