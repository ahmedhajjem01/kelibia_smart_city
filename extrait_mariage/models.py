from django.db import models
from django.conf import settings
import uuid
from extrait_naissance.models import Citoyen

class ExtraitMariage(models.Model):
    REGIME_CHOICES = [
        ('separation', 'Séparation des biens / الفصل في الأملاك'),
        ('communaute', 'Communauté des biens / الاشتراك في الأملاك'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="extraits_mariage",
        verbose_name="Utilisateur du portail"
    )
    
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    
    # Époux (Groom)
    epoux = models.ForeignKey(Citoyen, on_delete=models.CASCADE, related_name="mariages_epoux", verbose_name="Époux")
    # Épouse (Bride)
    epouse = models.ForeignKey(Citoyen, on_delete=models.CASCADE, related_name="mariages_epouse", verbose_name="Épouse")

    # Détails de l'acte
    annee_acte = models.IntegerField(verbose_name="Année de l'acte")
    numero_registre = models.CharField(max_length=50, verbose_name="N° Registre")
    
    # Localisation
    gouvernorat_ar = models.CharField(max_length=100, verbose_name="Gouvernorat AR", default="نابل")
    gouvernorat_fr = models.CharField(max_length=100, verbose_name="Gouvernorat FR", default="Nabeul")
    commune_ar = models.CharField(max_length=100, verbose_name="Commune AR", default="قليبية")
    commune_fr = models.CharField(max_length=100, verbose_name="Commune FR", default="Kelibia")

    # Détails du mariage
    date_mariage = models.DateField(verbose_name="Date du mariage")
    date_mariage_lettres_ar = models.CharField(max_length=255, verbose_name="Date en lettres AR")
    date_mariage_lettres_fr = models.CharField(max_length=255, verbose_name="Date en lettres FR")
    lieu_mariage_ar = models.CharField(max_length=200, verbose_name="Lieu du mariage AR", default="بلدية قليبية")
    lieu_mariage_fr = models.CharField(max_length=200, verbose_name="Lieu du mariage FR", default="Municipalité de Kelibia")
    
    regime_matrimonial = models.CharField(max_length=20, choices=REGIME_CHOICES, default='separation', verbose_name="Régime Matrimonial")
    
    # Mentions et Administration
    observations_ar = models.TextField(verbose_name="Observations AR", blank=True, default="")
    observations_fr = models.TextField(verbose_name="Observations FR", blank=True, default="")
    officer_etat_civil_ar = models.CharField(max_length=200, verbose_name="Officier État Civil AR", default="")
    officer_etat_civil_fr = models.CharField(max_length=200, verbose_name="Officier État Civil FR", default="")
    
    numero_ordre = models.CharField(max_length=50, verbose_name="Numéro d'ordre", blank=True, default="")
    prix = models.DecimalField(max_digits=6, decimal_places=3, verbose_name="Prix", default=2.000)
    is_paid = models.BooleanField(default=False, verbose_name="Payé")
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="Date du paiement")


    # Type of act
    TYPE_ACTE_CHOICES = [
        ('municipal', 'Acte Municipal / عقد بلدي'),
        ('notarial', 'Acte Notarié (Adouls) / عقد عدلي'),
    ]
    type_acte = models.CharField(max_length=20, choices=TYPE_ACTE_CHOICES, default='municipal', verbose_name="Type d'acte")
    
    # Contract scan (optional but recommended for Notarial)
    contrat_scan = models.FileField(upload_to='extraits_mariage/contrats/', null=True, blank=True, verbose_name="Scan du contrat")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def regime_ar(self):
        mapping = {
            'separation': 'الفصل في الأملاك',
            'communaute': 'الاشتراك في الأملاك',
        }
        return mapping.get(self.regime_matrimonial, self.regime_matrimonial)

    @property
    def regime_fr(self):
        mapping = {
            'separation': 'Séparation des biens',
            'communaute': 'Communauté des biens',
        }
        return mapping.get(self.regime_matrimonial, self.regime_matrimonial)

    def __str__(self):
        return f"Mariage: {self.epoux.nom_fr} & {self.epouse.nom_fr} ({self.annee_acte})"

    @property
    def get_qr_code(self):
        import qrcode
        import io
        import base64
        
        # URL for verification
        verify_url = f"http://127.0.0.1:8000/extrait-mariage/verify/{self.uuid}/"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

class DemandeMariage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente / قيد الانتظار'),
        ('verified', 'Documents Vérifiés / الوثائق مقبولة'),
        ('rejected', 'Rejetée / مرفوضة'),
        ('signed', 'Signée / وقع إبرام العقد'),
    ]

    TYPE_CHOICES = [
        ('municipal', 'Municipal / بلدي'),
        ('notaire', 'Notaire / عدلي'),
    ]
    LIEU_CHOICES = [
        ('municipality', 'Salle de la Municipalité / قاعة البلدية'),
        ('private', 'Lieu Privé / مكان خاص'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes_mariage'
    )

    type_contrat = models.CharField(max_length=20, choices=TYPE_CHOICES, default='municipal', verbose_name="Type de contrat")
    lieu_mariage = models.CharField(max_length=20, choices=LIEU_CHOICES, default='municipality', verbose_name="Lieu du mariage")

    # Spouse 1 (Groom - default context in portal usually)
    nom_epoux = models.CharField(max_length=200, verbose_name="Nom de l'époux")
    cin_epoux = models.CharField(max_length=8, verbose_name="CIN de l'époux")
    
    # Spouse 2 (Bride)
    nom_epouse = models.CharField(max_length=200, verbose_name="Nom de l'épouse")
    cin_epouse = models.CharField(max_length=8, verbose_name="CIN de l'épouse")

    date_souhaitee = models.DateField(verbose_name="Date de mariage souhaitée")
    regime_matrimonial = models.CharField(
        max_length=20, 
        choices=ExtraitMariage.REGIME_CHOICES, 
        default='separation', 
        verbose_name="Régime Matrimonial"
    )

    # Documents Epoux (Optional if notaire)
    cin_recto_epoux = models.ImageField(upload_to='declarations/mariage/epoux/cin_recto/', verbose_name="CIN Epoux Recto", null=True, blank=True)
    cin_verso_epoux = models.ImageField(upload_to='declarations/mariage/epoux/cin_verso/', verbose_name="CIN Epoux Verso", null=True, blank=True)
    extrait_naissance_epoux = models.FileField(upload_to='declarations/mariage/epoux/naissance/', verbose_name="Extrait Naissance Epoux", null=True, blank=True)
    certificat_medical_epoux = models.FileField(upload_to='declarations/mariage/epoux/medical/', verbose_name="Certificat Médical Epoux", null=True, blank=True)

    # Documents Epouse (Optional if notaire)
    cin_recto_epouse = models.ImageField(upload_to='declarations/mariage/epouse/cin_recto/', verbose_name="CIN Epouse Recto", null=True, blank=True)
    cin_verso_epouse = models.ImageField(upload_to='declarations/mariage/epouse/cin_verso/', verbose_name="CIN Epouse Verso", null=True, blank=True)
    extrait_naissance_epouse = models.FileField(upload_to='declarations/mariage/epouse/naissance/', verbose_name="Extrait Naissance Epouse", null=True, blank=True)
    certificat_medical_epouse = models.FileField(upload_to='declarations/mariage/epouse/medical/', verbose_name="Certificat Médical Epouse", null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Statut"
    )

    # For notaire case: Agent uploads the scan of the contract received from the notary
    contrat_recu_scan = models.FileField(
        upload_to='declarations/mariage/agent/contrats/', 
        null=True, blank=True, 
        verbose_name="Scan du contrat reçu (Côté Agent)"
    )

    commentaire_agent = models.TextField(blank=True, verbose_name="Commentaire de l'agent")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Demande d'acte de Mariage"
        verbose_name_plural = "Demandes d'actes de Mariage"
        ordering = ['-created_at']

    def __str__(self):
        return f"Demande de Mariage: {self.nom_epoux} & {self.nom_epouse} - {self.status}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_status = DemandeMariage.objects.get(pk=self.pk).status
        
        super().save(*args, **kwargs)

        # Si le statut passe à "signed", on crée l'extrait de mariage officiel
        if self.status == 'signed' and old_status != 'signed':
            from .models import ExtraitMariage
            from extrait_naissance.models import Citoyen
            from django.utils import timezone
            import random

            # On cherche ou crée les profils Citoyen pour les époux
            epoux, _ = Citoyen.objects.get_or_create(
                nom_fr=self.nom_epoux, 
                cin=self.cin_epoux,
                defaults={'nom_ar': self.nom_epoux} # Simplified
            )
            epouse, _ = Citoyen.objects.get_or_create(
                nom_fr=self.nom_epouse, 
                cin=self.cin_epouse,
                defaults={'nom_ar': self.nom_epouse} # Simplified
            )

            # Création de l'extrait
            ExtraitMariage.objects.create(
                user=self.citizen,
                epoux=epoux,
                epouse=epouse,
                annee_acte=timezone.now().year,
                numero_registre=str(random.randint(1000, 9999)),
                date_mariage=self.date_souhaitee,
                date_mariage_lettres_fr=self.date_souhaitee.strftime("%d/%m/%Y"),
                date_mariage_lettres_ar=self.date_souhaitee.strftime("%d/%m/%Y"), # Simplified
                regime_matrimonial=self.regime_matrimonial,
                type_acte='notarial' if self.type_contrat == 'notaire' else 'municipal',
                contrat_scan=self.contrat_recu_scan if self.type_contrat == 'notaire' else None,
                officer_etat_civil_fr="Agent Municipal (Automatique)",
                officer_etat_civil_ar="عضو البلدية (آلي)"
            )
