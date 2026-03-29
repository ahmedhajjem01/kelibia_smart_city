from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Reply, Notification


@receiver(post_save, sender=Reply)
def create_reply_notification(sender, instance, created, **kwargs):
    """Create a notification for the topic author when a reply is added."""
    if created:
        topic = instance.topic
        # Don't notify if the author replies to their own topic
        if topic.author != instance.author:
            Notification.objects.create(
                recipient=topic.author,
                topic=topic,
                reply=instance,
            )
