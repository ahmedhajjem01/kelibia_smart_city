from django.db import models
from django.conf import settings

class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='info') # info, success, warning, error
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True) # Optional link to the relevant page
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"

    class Meta:
        ordering = ['-created_at']
