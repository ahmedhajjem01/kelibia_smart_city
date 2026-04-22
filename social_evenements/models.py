from django.db import models
from django.conf import settings
from django.db.models import Q


class DemandeEvenement(models.Model):
    STATUS_CHOICES = [
        ('pending',            'En attente'),
        ('in_progress',        'En cours de traitement'),
        ('approved',           'Autorisée'),
        ('rejected',           'Rejetée'),
        ('changes_requested',  'Modifications demandées'),
    ]

    TYPE_EVENEMENT_CHOICES = [
        ('fete_familiale',   'Fête familiale / حفل عائلي'),
        ('mariage',          'Cérémonie de mariage / حفل زفاف'),
        ('remise_diplomes',  'Remise de diplômes / حفل التخرج'),
        ('concert',          'Concert / حفلة موسيقية'),
        ('marche',           'Marché / سوق'),
        ('association',      'Activité associative / نشاط جمعوي'),
        ('sportif',          'Événement sportif / حدث رياضي'),
        ('culturel',         'Événement culturel / حدث ثقافي'),
        ('commercial',       'Événement commercial / حدث تجاري'),
        ('religieux',        'Événement religieux / تظاهرة دينية'),
        ('politique',        'Réunion / Meeting politique / تجمع سياسي'),
        ('charite',          'Événement caritatif / نشاط خيري'),
        ('autre',            'Autre (préciser) / أخرى (تحديد)'),
    ]

    LIEU_CHOICES = [
        ('espace_public',  'Espace public (rue, place) / فضاء عمومي'),
        ('salle_fetes',    'Salle des fêtes municipale / قاعة الأفراح البلدية'),
        ('stade',          'Stade / ملعب'),
        ('plage',          'Plage / شاطئ'),
        ('domicile_prive', 'Domicile privé / منزل خاص'),
        ('autre',          'Autre lieu / مكان آخر'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_evenement',
        verbose_name="Demandeur",
    )

    # --- Événement ---
    titre_evenement = models.CharField(max_length=200, verbose_name="Intitulé de l'événement")
    type_evenement = models.CharField(max_length=30, choices=TYPE_EVENEMENT_CHOICES, default='autre', verbose_name="Type d'événement")
    type_evenement_libre = models.CharField(max_length=150, blank=True, null=True, verbose_name="Type d'événement (précision libre)")
    description = models.TextField(verbose_name="Description de l'événement")
    nombre_participants = models.PositiveIntegerField(verbose_name="Nombre estimé de participants")

    # --- Lieu & Dates ---
    lieu_type = models.CharField(max_length=30, choices=LIEU_CHOICES, default='espace_public', verbose_name="Type de lieu")
    lieu_details = models.CharField(max_length=300, verbose_name="Adresse / Précisions sur le lieu")
    # GPS coords (optional, from map pick)
    latitude = models.FloatField(null=True, blank=True, verbose_name="Latitude")
    longitude = models.FloatField(null=True, blank=True, verbose_name="Longitude")

    date_debut = models.DateField(verbose_name="Date de début")
    date_fin = models.DateField(verbose_name="Date de fin")
    heure_debut = models.TimeField(verbose_name="Heure de début")
    heure_fin = models.TimeField(verbose_name="Heure de fin")

    # --- Organisateur ---
    nom_organisateur = models.CharField(max_length=200, verbose_name="Nom complet de l'organisateur")
    cin_organisateur = models.CharField(max_length=8, verbose_name="CIN de l'organisateur")
    telephone_organisateur = models.CharField(max_length=20, verbose_name="Téléphone de l'organisateur")
    association_nom = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nom de l'association")

    # --- Documents ---
    cin_recto = models.ImageField(upload_to='declarations/evenements/cin_recto/', null=True, blank=True, verbose_name="CIN Recto")
    cin_verso = models.ImageField(upload_to='declarations/evenements/cin_verso/', null=True, blank=True, verbose_name="CIN Verso")
    plan_lieu = models.FileField(upload_to='declarations/evenements/plan/', null=True, blank=True, verbose_name="Plan / Carte du lieu")
    programme_evenement = models.FileField(upload_to='declarations/evenements/programme/', null=True, blank=True, verbose_name="Programme de l'événement")
    attestation_assurance = models.FileField(upload_to='declarations/evenements/assurance/', null=True, blank=True, verbose_name="Attestation d'assurance")
    plan_securite = models.FileField(upload_to='declarations/evenements/securite/', null=True, blank=True, verbose_name="Plan de sécurité")
    attestation_association = models.FileField(upload_to='declarations/evenements/association/', null=True, blank=True, verbose_name="Attestation d'enregistrement de l'association")

    # --- Gestion agent ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Statut")
    commentaire_agent = models.TextField(blank=True, verbose_name="Commentaire de l'agent")
    autorisation_signee = models.FileField(upload_to='autorisations/evenements/', blank=True, null=True, verbose_name="Autorisation signée")
    is_paid = models.BooleanField(default=False, verbose_name="Frais de dossier réglés")
    paid_at = models.DateTimeField(null=True, blank=True)

    # --- Conflict detection (set by backend) ---
    has_conflict = models.BooleanField(default=False, verbose_name="Conflit détecté")
    conflict_with = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='conflicting_requests', verbose_name="En conflit avec"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Demande d'autorisation d'événement"
        verbose_name_plural = "Demandes d'autorisation d'événements"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre_evenement} — {self.nom_organisateur} ({self.get_status_display()})"

    def detect_conflict(self):
        """
        Checks if another approved/pending event overlaps this one on the
        same lieu_type (or nearby GPS coords) and overlapping dates/times.
        Sets has_conflict and conflict_with fields.
        """
        from datetime import datetime

        qs = DemandeEvenement.objects.exclude(pk=self.pk).filter(
            status__in=['pending', 'in_progress', 'approved'],
            lieu_type=self.lieu_type,
        ).filter(
            # Date overlap: existing.date_debut <= self.date_fin AND existing.date_fin >= self.date_debut
            date_debut__lte=self.date_fin,
            date_fin__gte=self.date_debut,
        )

        for ev in qs:
            # Time overlap on same day
            # Convert times to comparable format
            ev_start = datetime.combine(ev.date_debut, ev.heure_debut)
            ev_end = datetime.combine(ev.date_fin, ev.heure_fin)
            self_start = datetime.combine(self.date_debut, self.heure_debut)
            self_end = datetime.combine(self.date_fin, self.heure_fin)

            if ev_start < self_end and ev_end > self_start:
                self.has_conflict = True
                self.conflict_with = ev
                return True

        self.has_conflict = False
        self.conflict_with = None
        return False
