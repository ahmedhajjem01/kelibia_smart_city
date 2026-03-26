from django.db import models
from django.conf import settings

class DemandeResidence(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_residence'
    )
    
    # New Information fields
    profession = models.CharField(max_length=100, blank=True, null=True, verbose_name="Profession")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="N° de téléphone")
    adresse_demandee = models.TextField(verbose_name="Adresse du domicile à Kélibia")
    motif_demande = models.TextField(blank=True, null=True, verbose_name="Motif de la demande")
    
    # Document fields (Split CIN into Recto/Verso)
    cin_recto = models.ImageField(
        upload_to='declarations/residence/cin_recto/',
        verbose_name="CIN Recto",
        null=True, blank=True
    )
    cin_verso = models.ImageField(
        upload_to='declarations/residence/cin_verso/',
        verbose_name="CIN Verso",
        null=True, blank=True
    )
    
    # Legacy field for compatibility (optional)
    cin_copy = models.FileField(
        upload_to='declarations/residence/cin/',
        verbose_name="Copie de la CIN (Fichier unique)",
        null=True, blank=True
    )
    
    quitus_municipal = models.FileField(
        upload_to='declarations/residence/quitus/',
        verbose_name="Attestation de décharge (Quitus)",
        null=True, blank=True
    )
    
    acte_deces_conjoint = models.FileField(
        upload_to='declarations/residence/deces/',
        blank=True,
        null=True,
        verbose_name="Copie de l'acte de décès (si applicable)"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Statut"
    )
    
    # The final "paper" uploaded by the agent
    issued_document = models.FileField(
        upload_to='certificates/residence/issued/',
        blank=True,
        null=True,
        verbose_name="Attestation signée (Papier)"
    )

    commentaire_agent = models.TextField(blank=True, verbose_name="Commentaire de l'agent")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Demande d'Attestation de Résidence"
        verbose_name_plural = "Demandes d'Attestation de Résidence"
        ordering = ['-created_at']

    def __str__(self):
        return f"Demande de {self.citizen.get_full_name()} - {self.status}"
