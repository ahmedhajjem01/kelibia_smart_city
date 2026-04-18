from django.db import models
from django.conf import settings


class DemandeCommerce(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('licence_enseigne', "Licence d'installation d'une enseigne publicitaire"),
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
        related_name='demandes_commerce'
    )
    service_type = models.CharField(max_length=40, choices=SERVICE_TYPE_CHOICES, verbose_name="Type de service")
    nom_commerce = models.CharField(max_length=200, verbose_name="Nom du commerce")
    adresse_commerce = models.TextField(verbose_name="Adresse du commerce")
    description = models.TextField(blank=True, verbose_name="Description / Détails")
    cin_recto = models.ImageField(upload_to='declarations/commerce/cin_recto/', null=True, blank=True)
    cin_verso = models.ImageField(upload_to='declarations/commerce/cin_verso/', null=True, blank=True)
    photo_enseigne = models.ImageField(
        upload_to='declarations/commerce/enseignes/',
        null=True, blank=True,
        verbose_name="Photo de l'enseigne (optionnel)"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False, verbose_name="Paiement reçu")
    commentaire_agent = models.TextField(blank=True)
    issued_document = models.FileField(upload_to='certificates/commerce/issued/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande Boutiques & Commerces"
        verbose_name_plural = "Demandes Boutiques & Commerces"

    def __str__(self):
        return f"{self.get_service_type_display()} — {self.nom_commerce} ({self.status})"
