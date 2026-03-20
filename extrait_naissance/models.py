import uuid
from django.db import models
from django.conf import settings

class Citoyen(models.Model):
    n_etat_civil = models.CharField(max_length=50, unique=True, verbose_name="N° État Civil")
    cin = models.CharField(max_length=8, unique=True, null=True, blank=True, verbose_name="CIN")
    
    prenom_ar = models.CharField(max_length=100, verbose_name="Prénom AR")
    prenom_fr = models.CharField(max_length=100, verbose_name="Prénom FR")
    nom_ar = models.CharField(max_length=100, verbose_name="Nom AR")
    nom_fr = models.CharField(max_length=100, verbose_name="Nom FR")
    
    date_naissance = models.DateField(verbose_name="Date de naissance")
    date_naissance_lettres_ar = models.CharField(max_length=255, verbose_name="Date en lettres AR", blank=True)
    date_naissance_lettres_fr = models.CharField(max_length=255, verbose_name="Date en lettres FR", blank=True)
    
    lieu_naissance_ar = models.CharField(max_length=200, verbose_name="Lieu de naissance AR")
    lieu_naissance_fr = models.CharField(max_length=200, verbose_name="Lieu de naissance FR")
    
    sexe = models.CharField(max_length=10, choices=[('M', 'M/ذكر'), ('F', 'F/أنثى')], verbose_name="Sexe")
    
    profession_ar = models.CharField(max_length=100, verbose_name="Profession AR", blank=True, default="")
    profession_fr = models.CharField(max_length=100, verbose_name="Profession FR", blank=True, default="")
    nationalite_ar = models.CharField(max_length=50, verbose_name="Nationalité AR", default="تونسية")
    nationalite_fr = models.CharField(max_length=50, verbose_name="Nationalité FR", default="Tunisienne")
    
    pere = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='enfants_pere', verbose_name="Père")
    mere = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='enfants_mere', verbose_name="Mère")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.prenom_fr} {self.nom_fr} ({self.n_etat_civil})"

class ExtraitNaissance(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="extraits_naissance",
        verbose_name="Utilisateur du portail"
    )
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    titulaire = models.ForeignKey(Citoyen, on_delete=models.CASCADE, related_name="extraits_naissance", verbose_name="Titulaire de l'acte")
    
    # 1. En-tête Administratif
    arrondissement_gauche = models.CharField(max_length=100, verbose_name="Arrondissement Document", blank=True, default="K/Kelibia")
    annee_acte = models.IntegerField(verbose_name="Année de l'acte")
    numero_registre = models.CharField(max_length=50, verbose_name="N° Registre")
    declaration = models.BooleanField(default=False, verbose_name="Déclaration")
    jugement = models.BooleanField(default=False, verbose_name="Jugement")

    # 2. Localisation Document
    gouvernorat_ar = models.CharField(max_length=100, verbose_name="Gouvernorat AR", default="نابل")
    gouvernorat_fr = models.CharField(max_length=100, verbose_name="Gouvernorat FR", default="Nabeul")
    delegation_ar = models.CharField(max_length=100, verbose_name="Délégation AR", default="قليبية")
    delegation_fr = models.CharField(max_length=100, verbose_name="Délégation FR", default="Kelibia")
    commune_ar = models.CharField(max_length=100, verbose_name="Commune AR", default="قليبية")
    commune_fr = models.CharField(max_length=100, verbose_name="Commune FR", default="Kelibia")
    arrondissement_municipal_ar = models.CharField(max_length=100, verbose_name="Arrondissement Municipal AR", blank=True, default="")
    arrondissement_municipal_fr = models.CharField(max_length=100, verbose_name="Arrondissement Municipal FR", blank=True, default="")
    imada_ar = models.CharField(max_length=100, verbose_name="Imada AR", default="")
    imada_fr = models.CharField(max_length=100, verbose_name="Imada FR", default="")

    # 5. Détails d'Enregistrement
    date_declaration = models.DateTimeField(verbose_name="Date de déclaration")
    declarant_ar = models.CharField(max_length=200, verbose_name="Déclarant AR", default="")
    declarant_fr = models.CharField(max_length=200, verbose_name="Déclarant FR", default="")
    officer_etat_civil_ar = models.CharField(max_length=200, verbose_name="Officier État Civil AR", default="")
    officer_etat_civil_fr = models.CharField(max_length=200, verbose_name="Officier État Civil FR", default="")

    # 6. Mentions Marginales
    observations_ar = models.TextField(verbose_name="Observations AR", blank=True, default="")
    observations_fr = models.TextField(verbose_name="Observations FR", blank=True, default="")
    numero_ordre = models.CharField(max_length=50, verbose_name="Numéro d'ordre", blank=True, default="")
    prix = models.DecimalField(max_digits=6, decimal_places=3, verbose_name="Prix", default=0.500)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Extrait de {self.titulaire.prenom_fr} {self.titulaire.nom_fr} ({self.annee_acte})"

    @property
    def get_qr_code(self):
        import qrcode
        import io
        import base64
        
        # URL for verification
        verify_url = f"http://127.0.0.1:8000/extrait-naissance/verify/{self.uuid}/"
        
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

    class Meta:
        verbose_name = "Extrait de Naissance"
        verbose_name_plural = "Extraits de Naissance"
        ordering = ['-annee_acte', '-created_at']
