from django.db import models
from django.conf import settings


class DemandeEau(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('raccordement_eau', "Raccordement au réseau d'eau"),
        ('raccordement_electricite', 'Raccordement électrique'),
        ('raccordement_egouts', 'Raccordement aux égouts'),
        ('reclamation_eau', 'Réclamation compteur eau'),
        ('reclamation_electricite', 'Réclamation compteur électricité'),
        ('autre', 'Autre'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_eau'
    )
    service_type = models.CharField(max_length=40, choices=SERVICE_TYPE_CHOICES, verbose_name="Type de service")
    adresse = models.TextField(verbose_name="Adresse du raccordement / compteur")
    description = models.TextField(blank=True, verbose_name="Description / Détails")
    cin_recto = models.ImageField(upload_to='declarations/eau/cin_recto/', null=True, blank=True)
    cin_verso = models.ImageField(upload_to='declarations/eau/cin_verso/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False, verbose_name="Paiement reçu")
    commentaire_agent = models.TextField(blank=True)
    issued_document = models.FileField(upload_to='certificates/eau/issued/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande Eau/Lumière/Égouts"
        verbose_name_plural = "Demandes Eau/Lumière/Égouts"

    def __str__(self):
        return f"{self.get_service_type_display()} — {self.citizen} ({self.status})"
