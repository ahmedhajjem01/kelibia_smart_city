import uuid
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from extrait_naissance.models import Citoyen

class ExtraitDeces(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="extraits_deces",
        verbose_name="Utilisateur du portail"
    )
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    defunt = models.ForeignKey(Citoyen, on_delete=models.CASCADE, related_name="extraits_deces", verbose_name="Défunt")
    
    # Administratif
    annee_acte = models.IntegerField(verbose_name="Année de l'acte")
    numero_registre = models.CharField(max_length=50, verbose_name="N° Registre")
    
    # Décès
    date_deces = models.DateTimeField(verbose_name="Date et heure du décès")
    lieu_deces_ar = models.CharField(max_length=200, verbose_name="Lieu du décès AR")
    lieu_deces_fr = models.CharField(max_length=200, verbose_name="Lieu du décès FR")
    
    # Déclarant
    declarant_ar = models.CharField(max_length=200, verbose_name="Déclarant AR")
    declarant_fr = models.CharField(max_length=200, verbose_name="Déclarant FR")
    
    # Localisation Document
    gouvernorat_ar = models.CharField(max_length=100, verbose_name="Gouvernorat AR", default="نابل")
    gouvernorat_fr = models.CharField(max_length=100, verbose_name="Gouvernorat FR", default="Nabeul")
    commune_ar = models.CharField(max_length=100, verbose_name="Commune AR", default="قليبية")
    commune_fr = models.CharField(max_length=100, verbose_name="Commune FR", default="Kelibia")
    
    # Administration
    officer_etat_civil_ar = models.CharField(max_length=200, verbose_name="Officier État Civil AR", default="")
    officer_etat_civil_fr = models.CharField(max_length=200, verbose_name="Officier État Civil FR", default="")
    
    numero_ordre = models.CharField(max_length=50, verbose_name="Numéro d'ordre", blank=True, default="")
    prix = models.DecimalField(max_digits=6, decimal_places=3, verbose_name="Prix", default=0.500)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Décès: {self.defunt.prenom_fr} {self.defunt.nom_fr} ({self.annee_acte})"

    @property
    def get_qr_code(self):
        import qrcode
        import io
        import base64
        
        # URL for verification
        verify_url = f"http://127.0.0.1:8000/extrait-deces/verify/{self.uuid}/"
        
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

class DeclarationDeces(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente / قيد الانتظار'),
        ('validated', 'Validé / تم التحقق'),
        ('rejected', 'Rejeté / مرفوض'),
    ]

    declarant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="declarations_deces",
        verbose_name="Déclarant"
    )
    defunt = models.ForeignKey(
        Citoyen,
        on_delete=models.CASCADE,
        related_name="declarations_deces",
        verbose_name="Défunt"
    )
    
    date_deces = models.DateTimeField(verbose_name="Date et heure du décès")
    lieu_deces_ar = models.CharField(max_length=200, verbose_name="Lieu du décès AR")
    lieu_deces_fr = models.CharField(max_length=200, verbose_name="Lieu du décès FR")
    
    police_report = models.FileField(
        upload_to='declarations/deces/police/', 
        blank=True, 
        null=True, 
        verbose_name="Rapport de police (si suspect)"
    )
    
    commentaire = models.TextField(blank=True, verbose_name="Commentaire / ملاحظات")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Déclaration: {self.defunt.prenom_fr} {self.defunt.nom_fr} ({self.status})"

    class Meta:
        verbose_name = "Déclaration de Décès"
        verbose_name_plural = "Déclarations de Décès"

class DemandeInhumation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente / قيد الانتظار'),
        ('approved', 'Approuvée / تمت الموافقة'),
        ('rejected', 'Refusée / مرفوضة'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="demandes_inhumation",
        verbose_name="Demandeur"
    )
    declaration_deces = models.OneToOneField(
        DeclarationDeces,
        on_delete=models.CASCADE,
        related_name="demande_inhumation",
        verbose_name="Déclaration de décès associée"
    )
    
    cimetiere_ar = models.CharField(max_length=200, verbose_name="Cimetière (AR)", default="مقبرة قليبية")
    cimetiere_fr = models.CharField(max_length=200, verbose_name="Cimetière (FR)", default="Cimetière de Kelibia")
    
    date_souhaitee = models.DateTimeField(verbose_name="Date et heure souhaitées d'inhumation")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inhumation: {self.declaration_deces.defunt.prenom_fr} - {self.status}"

    class Meta:
        verbose_name = "Demande d'inhumation"
        verbose_name_plural = "Demandes d'inhumation"

# --- SIGNALS ---

@receiver(post_save, sender=DeclarationDeces)
def create_extrait_deces_on_validation(sender, instance, created, **kwargs):
    """
    Automatically creates an ExtraitDeces official record when a death declaration is validated.
    """
    if instance.status == 'validated':
        # Avoid circular import
        from .models import ExtraitDeces
        import datetime

        # Check if an official extract already exists for this deceased person
        if not ExtraitDeces.objects.filter(defunt=instance.defunt).exists():
            now = datetime.datetime.now()
            
            # Auto-calculate acting year and registry number
            acting_year = instance.date_deces.year if instance.date_deces else now.year
            
            # Get last registry number for this year to increment correctly
            last_record = ExtraitDeces.objects.filter(annee_acte=acting_year).order_by('-numero_registre').first()
            next_num = 1
            if last_record and str(last_record.numero_registre).isdigit():
                next_num = int(last_record.numero_registre) + 1

            # Determine declarant names (fallback to authenticated user profile)
            declarant_name_fr = f"{instance.declarant.first_name} {instance.declarant.last_name}".strip() or instance.declarant.username
            declarant_name_ar = f"{instance.declarant.first_name} {instance.declarant.last_name}".strip() or instance.declarant.username

            # Create the official record
            ExtraitDeces.objects.create(
                user=instance.declarant, # Link to citizen's account for tracking
                defunt=instance.defunt,
                annee_acte=acting_year,
                numero_registre=str(next_num),
                date_deces=instance.date_deces,
                lieu_deces_ar=instance.lieu_deces_ar or "قليبية",
                lieu_deces_fr=instance.lieu_deces_fr or "Kelibia",
                declarant_ar=declarant_name_ar,
                declarant_fr=declarant_name_fr,
                officer_etat_civil_ar="ضابط الحالة المدنية",
                officer_etat_civil_fr="Officier d'État Civil",
                numero_ordre=str(next_num),
            )
