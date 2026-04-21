from django.db import models
from django.conf import settings


class DemandeConstruction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('en_cours_instruction', 'En cours d\'instruction'),
        ('favorable', 'Avis favorable'),
        ('defavorable', 'Avis défavorable'),
        ('changes_requested', 'Modifications demandées'),
        ('permis_delivre', 'Permis délivré'),
        ('rejet_definitif', 'Rejet définitif'),
    ]

    TYPE_TRAVAUX_CHOICES = [
        ('construction_neuve', 'Construction neuve'),
        ('renovation', 'Rénovation'),
        ('extension', 'Extension'),
        ('demolition', 'Démolition'),
        ('cloture', 'Clôture'),
        ('piscine', 'Piscine'),
        ('panneau_solaire', 'Panneaux solaires'),
        ('ravalement', 'Ravalement de façade'),
        ('autre', 'Autre'),
    ]

    USAGE_CHOICES = [
        ('habitation', 'Habitation'),
        ('commercial', 'Commercial'),
        ('industriel', 'Industriel'),
        ('agricole', 'Agricole'),
        ('mixte', 'Mixte'),
    ]

    PRIORITE_CHOICES = [
        ('normale', 'Normale'),
        ('haute', 'Haute'),
        ('urgente', 'Urgente'),
    ]

    # Citizen
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_construction'
    )

    # Terrain
    adresse_terrain = models.CharField(max_length=300)
    numero_parcelle = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # Travaux
    type_travaux = models.CharField(max_length=50, choices=TYPE_TRAVAUX_CHOICES)
    type_travaux_libre = models.CharField(max_length=200, blank=True)
    usage_batiment = models.CharField(max_length=50, choices=USAGE_CHOICES, default='habitation')
    description_travaux = models.TextField()

    # Dimensions
    surface_terrain = models.FloatField(null=True, blank=True, help_text='m²')
    surface_construite = models.FloatField(null=True, blank=True, help_text='m²')
    nombre_etages = models.IntegerField(default=1)
    hauteur_max = models.FloatField(null=True, blank=True, help_text='mètres')

    # Planning
    date_debut_prevue = models.DateField(null=True, blank=True)
    duree_travaux_mois = models.IntegerField(null=True, blank=True)
    cout_estime = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Entrepreneur
    nom_entrepreneur = models.CharField(max_length=200, blank=True)
    telephone_entrepreneur = models.CharField(max_length=20, blank=True)

    # Propriétaire
    nom_proprietaire = models.CharField(max_length=200)
    cin_proprietaire = models.CharField(max_length=20, blank=True)
    telephone_proprietaire = models.CharField(max_length=20, blank=True)

    # Documents
    titre_foncier = models.FileField(upload_to='construction/titres/', null=True, blank=True)
    plan_architectural = models.FileField(upload_to='construction/plans/', null=True, blank=True)
    photo_terrain = models.ImageField(upload_to='construction/photos/', null=True, blank=True)
    devis_estimatif = models.FileField(upload_to='construction/devis/', null=True, blank=True)
    cin_proprietaire_recto = models.ImageField(upload_to='construction/cin/', null=True, blank=True)
    cin_proprietaire_verso = models.ImageField(upload_to='construction/cin/', null=True, blank=True)

    # Status & Agent
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='normale')
    commentaire_agent = models.TextField(blank=True)
    permis_signe = models.FileField(upload_to='construction/permis/', null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    is_high_risk = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de construction'
        verbose_name_plural = 'Demandes de construction'

    def __str__(self):
        return f"{self.get_type_travaux_display()} — {self.adresse_terrain} ({self.citizen.email})"

    def compute_risk(self):
        """Auto-detect high-risk projects."""
        if self.type_travaux == 'demolition' or (self.nombre_etages and self.nombre_etages > 3):
            self.is_high_risk = True
            self.priorite = 'haute'
        self.save(update_fields=['is_high_risk', 'priorite'])


class DemandeGoudronnage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('en_cours', 'En cours de traitement'),
        ('traite', 'Traité'),
        ('rejete', 'Rejeté'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_goudronnage'
    )
    nom_prenom = models.CharField(max_length=200)
    cin = models.CharField(max_length=8)
    adresse_residence = models.CharField(max_length=300)
    localisation_rue = models.TextField(help_text='Description de la rue concernée')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    cin_copie = models.ImageField(upload_to='goudronnage/cin/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    commentaire_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de goudronnage'
        verbose_name_plural = 'Demandes de goudronnage'

    def __str__(self):
        return f"Goudronnage — {self.adresse_residence} ({self.citizen.email})"


class DemandeCertificatVocation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('en_cours', 'En cours de traitement'),
        ('delivre', 'Certificat délivré'),
        ('rejete', 'Rejeté'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_certificat_vocation'
    )
    nom_prenom = models.CharField(max_length=200)
    cin = models.CharField(max_length=8)
    adresse_bien = models.CharField(max_length=300)
    cin_copie = models.ImageField(upload_to='vocation/cin/', null=True, blank=True)
    quitus = models.FileField(upload_to='vocation/quitus/', null=True, blank=True)
    certificat_propriete = models.FileField(upload_to='vocation/propriete/', null=True, blank=True)
    plan_cadastral = models.FileField(upload_to='vocation/cadastral/', null=True, blank=True)
    plan_situation = models.FileField(upload_to='vocation/situation/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    commentaire_agent = models.TextField(blank=True)
    certificat_signe = models.FileField(upload_to='vocation/delivre/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de certificat de vocation'
        verbose_name_plural = 'Demandes de certificat de vocation'


class DemandeRaccordement(models.Model):
    TYPE_RESEAU_CHOICES = [
        ('eau', 'Eau (SONEDE)'),
        ('electricite', 'Électricité (STEG)'),
        ('assainissement', 'Assainissement (ONAS)'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('visite_programmee', 'Visite programmée'),
        ('devis_envoye', 'Devis envoyé'),
        ('paye', 'Devis payé'),
        ('termine', 'Terminé / Branché'),
        ('rejete', 'Rejeté'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_raccordement'
    )
    type_reseau = models.CharField(max_length=20, choices=TYPE_RESEAU_CHOICES)
    adresse_raccordement = models.CharField(max_length=300)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Documents
    cin_copie = models.FileField(upload_to='raccordement/cin/', null=True, blank=True)
    titre_propriete = models.FileField(upload_to='raccordement/propriete/', null=True, blank=True)
    permis_batir = models.FileField(upload_to='raccordement/permis/', null=True, blank=True)
    plan_situation = models.FileField(upload_to='raccordement/situation/', null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    devis_montant = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    devis_pdf = models.FileField(upload_to='raccordement/devis/', null=True, blank=True)
    date_visite = models.DateTimeField(null=True, blank=True)
    commentaire_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de raccordement'
        verbose_name_plural = 'Demandes de raccordement'

    def __str__(self):
        return f"Raccordement {self.get_type_reseau_display()} — {self.adresse_raccordement} ({self.citizen.email})"
