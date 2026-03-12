from django.db import models
from django.conf import settings

class Reclamation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('resolved', 'Résolue'),
        ('rejected', 'Rejetée'),
    ]

    CATEGORY_CHOICES = [
        ('lighting', 'Éclairage Public'),
        ('trash', 'Déchets / Hygiène'),
        ('roads', 'Voirie / Routes'),
        ('noise', 'Nuisances Sonores'),
        ('other', 'Autre'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='my_reclamations',
        limit_choices_to={'user_type': 'citizen'}
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_reclamations',
        limit_choices_to={'user_type': 'agent'}
    )
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name="Catégorie")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Statut")
    image = models.ImageField(upload_to='reclamations/', null=True, blank=True, verbose_name="Image / Preuve")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

    class Meta:
        ordering = ['-created_at']
