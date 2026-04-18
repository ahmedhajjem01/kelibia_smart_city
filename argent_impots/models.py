from django.db import models
from django.conf import settings


class DemandeImpot(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('enregistrement_bien', "Enregistrement d'un bien (Rez-de-chaussée, étage, garage)"),
        ('changement_propriete', 'Changement de propriété (Achat ou héritage)'),
        ('changement_vocation', 'Changement de vocation (Logement en commerce, etc.)'),
        ('arret_activite', "Déclaration d'arrêt d'activité (Fermer une boutique)"),
        ('certificat_imposition', "Certificat d'inscription au rôle d'imposition"),
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
        related_name='demandes_impot'
    )
    service_type = models.CharField(max_length=40, choices=SERVICE_TYPE_CHOICES, verbose_name="Type de service")
    adresse_bien = models.TextField(verbose_name="Adresse du bien / local")
    description = models.TextField(blank=True, verbose_name="Description / Détails")
    cin_recto = models.ImageField(upload_to='declarations/impots/cin_recto/', null=True, blank=True)
    cin_verso = models.ImageField(upload_to='declarations/impots/cin_verso/', null=True, blank=True)
    document_propriete = models.FileField(
        upload_to='declarations/impots/documents/',
        null=True, blank=True,
        verbose_name="Document de propriété (optionnel)"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False, verbose_name="Paiement reçu")
    commentaire_agent = models.TextField(blank=True)
    issued_document = models.FileField(upload_to='certificates/impots/issued/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande Argent & Impôts"
        verbose_name_plural = "Demandes Argent & Impôts"

    def __str__(self):
        return f"{self.get_service_type_display()} — {self.citizen} ({self.status})"
