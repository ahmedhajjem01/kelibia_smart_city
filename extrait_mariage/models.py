from django.db import models
from django.conf import settings
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

    class Meta:
        verbose_name = "Extrait de Mariage"
        verbose_name_plural = "Extraits de Mariage"
        ordering = ['-annee_acte', '-created_at']
