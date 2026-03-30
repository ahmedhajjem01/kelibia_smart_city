from django.db import models
from django.conf import settings

class DemandeLivretFamille(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('ready', 'Prêt pour retrait'),
    ]

    is_paid = models.BooleanField(default=False, verbose_name="Paiement Reçu")


    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='demandes_livret')
    
    nom_chef_famille = models.CharField(max_length=100, verbose_name='Nom du chef de famille')
    prenom_chef_famille = models.CharField(max_length=100, verbose_name='Prénom du chef de famille')
    cin_epoux = models.CharField(max_length=8, blank=True, null=True, verbose_name="CIN de l'époux")
    cin_epouse = models.CharField(max_length=8, blank=True, null=True, verbose_name="CIN de l'épouse")
    
    guichet_recuperation = models.CharField(max_length=50, blank=True, null=True, verbose_name='Guichet de récupération')

    
    etat_livret = models.CharField(max_length=20, choices=[
        ('actif', 'Actif'),
        ('divorce', 'Divorce'),
        ('deces', "Décès d'un conjoint")
    ], default='actif', verbose_name='État du Livret de Famille')
    motif_demande = models.CharField(max_length=50, choices=[
        ('premier_livret', 'Premier livret'),
        ('renouvellement', 'Renouvellement'),
        ('duplicata', 'Duplicata / Nègre')
    ], default='premier_livret', verbose_name='Motif de la demande')

    photo_chef_famille = models.ImageField(upload_to='declarations/livret/photos/', null=True, blank=True, verbose_name='Photo du chef de famille (facultative)')
    extrait_mariage = models.FileField(upload_to='declarations/livret/mariage/')
    extrait_naissance_epoux1 = models.FileField(upload_to='declarations/livret/naissance_1/')
    extrait_naissance_epoux2 = models.FileField(upload_to='declarations/livret/naissance_2/')
    extraits_enfants = models.FileField(upload_to='declarations/livret/enfants/', null=True, blank=True)
    extrait_deces_epoux = models.FileField(upload_to='declarations/livret/deces_epoux/', null=True, blank=True)
    jugement_divorce = models.FileField(upload_to='declarations/livret/divorce/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    commentaire_agent = models.TextField(blank=True, verbose_name='Commentaire de agent')
    issued_document = models.FileField(upload_to='certificates/livret/issued/', null=True, blank=True, verbose_name='Livret prêt ou Quittance')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Demande de Livret de Famille'
        verbose_name_plural = 'Demandes de Livret de Famille'
        ordering = ['-created_at']

    def __str__(self):
        return f'Demande Livret de Famille - {self.nom_chef_famille} {self.prenom_chef_famille} - {self.status}'
