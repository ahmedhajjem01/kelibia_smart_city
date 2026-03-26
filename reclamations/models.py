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

    PRIORITY_CHOICES = [
        ('faible',   'Faible'),
        ('normale',  'Normale'),
        ('urgente',  'Urgente'),
    ]

    # Mapping catégorie → service responsable
    SERVICE_MAP = {
        'lighting': 'Service Éclairage Public',
        'trash':    'Service Hygiène & Propreté',
        'roads':    'Service Voirie & Infrastructure',
        'noise':    'Service Ordre & Tranquillité',
        'other':    'Service Technique Général',
    }

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
    title       = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name="Catégorie")
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES,   default='pending', verbose_name="Statut")
    priority    = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normale', verbose_name="Priorité")
    service_responsable = models.CharField(max_length=100, blank=True, verbose_name="Service Responsable")
    is_duplicate = models.BooleanField(default=False, verbose_name="Doublon détecté")
    image       = models.ImageField(upload_to='reclamations/', null=True, blank=True, verbose_name="Image / Preuve")
    latitude    = models.FloatField(null=True, blank=True, verbose_name="Latitude")
    longitude   = models.FloatField(null=True, blank=True, verbose_name="Longitude")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-assign service_responsable from category if not set
        if not self.service_responsable and self.category:
            self.service_responsable = self.SERVICE_MAP.get(self.category, 'Service Technique Général')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title} - {self.get_status_display()}"

    class Meta:
        ordering = ['-created_at']
