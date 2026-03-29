from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Tag")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Topic(models.Model):
    CATEGORY_CHOICES = [
        ('questions', 'Questions aux agents municipaux'),
        ('suggestions', "Suggestions d'amelioration"),
        ('debates', 'Debats citoyens'),
    ]

    title       = models.CharField(max_length=200, verbose_name="Titre")
    content     = models.TextField(verbose_name="Contenu")
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='questions', verbose_name="Categorie")
    author      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_topics', verbose_name="Auteur")
    tags        = models.ManyToManyField('Tag', blank=True, related_name='topics', verbose_name="Tags")
    is_pinned   = models.BooleanField(default=False, verbose_name="Epingle")
    is_resolved = models.BooleanField(default=False, verbose_name="Resolu")
    views       = models.PositiveIntegerField(default=0, verbose_name="Vues")
    created_at  = models.DateTimeField(auto_now_add=True, verbose_name="Cree le")
    updated_at  = models.DateTimeField(auto_now=True, verbose_name="Modifie le")

    def __str__(self):
        return self.title

    @property
    def replies_count(self):
        return self.replies.count()

    @property
    def votes_count(self):
        return self.votes.filter(topic=self).count()

    class Meta:
        ordering = ['-is_pinned', '-created_at']


class Reply(models.Model):
    topic      = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='replies', verbose_name="Sujet")
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_replies', verbose_name="Auteur")
    content    = models.TextField(verbose_name="Contenu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Cree le")

    def __str__(self):
        return f"Reponse de {self.author} sur '{self.topic.title}'"

    @property
    def votes_count(self):
        return self.votes.filter(reply=self).count()

    class Meta:
        ordering = ['created_at']


class Vote(models.Model):
    user   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_votes')
    topic  = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)
    reply  = models.ForeignKey(Reply, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'topic'],
                condition=models.Q(topic__isnull=False),
                name='unique_user_topic_vote'
            ),
            models.UniqueConstraint(
                fields=['user', 'reply'],
                condition=models.Q(reply__isnull=False),
                name='unique_user_reply_vote'
            ),
        ]


class Notification(models.Model):
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_notifications')
    topic      = models.ForeignKey(Topic, on_delete=models.CASCADE)
    reply      = models.ForeignKey(Reply, on_delete=models.CASCADE, null=True, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif pour {self.recipient} topic #{self.topic_id}"

    class Meta:
        ordering = ['-created_at']
