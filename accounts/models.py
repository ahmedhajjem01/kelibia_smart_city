from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    GOVERNORATE_CHOICES = [
        ('Ariana', 'Ariana'),
        ('Beja', 'Béja'),
        ('Ben Arous', 'Ben Arous'),
        ('Bizerte', 'Bizerte'),
        ('Gabes', 'Gabès'),
        ('Gafsa', 'Gafsa'),
        ('Jendouba', 'Jendouba'),
        ('Kairouan', 'Kairouan'),
        ('Kasserine', 'Kasserine'),
        ('Kebili', 'Kébili'),
        ('Kef', 'Le Kef'),
        ('Mahdia', 'Mahdia'),
        ('Manouba', 'La Manouba'),
        ('Medenine', 'Médenine'),
        ('Monastir', 'Monastir'),
        ('Nabeul', 'Nabeul'),
        ('Sfax', 'Sfax'),
        ('Sidi Bouzid', 'Sidi Bouzid'),
        ('Siliana', 'Siliana'),
        ('Sousse', 'Sousse'),
        ('Tataouine', 'Tataouine'),
        ('Tozeur', 'Tozeur'),
        ('Tunis', 'Tunis'),
        ('Zaghouan', 'Zaghouan'),
    ]

    USER_TYPE_CHOICES = [
        ('citizen', 'Citoyen'),
        ('agent', 'Agent Municipal'),
        ('supervisor', 'Superviseur'),
    ]

    email = models.EmailField(unique=True, blank=False, verbose_name="Adresse Email")
    cin = models.CharField(max_length=8, unique=True, verbose_name="Numéro CIN")
    phone = models.CharField(max_length=8, unique=True, verbose_name="Numéro de Téléphone")
    address = models.TextField(verbose_name="Adresse")
    governorate = models.CharField(max_length=50, choices=GOVERNORATE_CHOICES, verbose_name="Gouvernorat", default='Nabeul')
    city = models.CharField(max_length=255, verbose_name="Ville", default='Kelibia')
    first_name_ar = models.CharField(max_length=255, blank=True, verbose_name="Prénom (Arabe)")
    last_name_ar = models.CharField(max_length=255, blank=True, verbose_name="Nom (Arabe)")
    user_type = models.CharField(max_length=50, choices=USER_TYPE_CHOICES, default='citizen', verbose_name="Type d'utilisateur")
    is_verified = models.BooleanField(default=False, verbose_name="Est vérifié")
    cin_front_image = models.TextField(null=True, blank=True, verbose_name="CIN Face Avant (Base64 Old)")
    cin_back_image = models.TextField(null=True, blank=True, verbose_name="CIN Face Arrière (Base64 Old)")
    
    # New completely fresh fields for Base64 to bypass Postgres varchar(100) lock
    cin_front_utf = models.TextField(null=True, blank=True, verbose_name="CIN Front Base64 NEW")
    cin_back_utf = models.TextField(null=True, blank=True, verbose_name="CIN Back Base64 NEW")

    # Extra Information for Civil Registry
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    place_of_birth = models.CharField(max_length=255, null=True, blank=True, verbose_name="Lieu de naissance")
    
    is_married = models.BooleanField(default=False, verbose_name="Est marié(e)")
    spouse_cin = models.CharField(max_length=50, blank=True, null=True, verbose_name="CIN du conjoint")
    spouse_first_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Prénom du conjoint")
    spouse_last_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Nom du conjoint")

    # ASD: Abonnement Service à Distance (Yearly municipal subscription)
    asd_active = models.BooleanField(default=False, verbose_name="Abonnement ASD Actif")
    asd_expiration = models.DateTimeField(null=True, blank=True, verbose_name="Date d'expiration ASD")

    @property
    def has_active_asd(self):
        from django.utils import timezone
        if not self.asd_active:
            return False
        if self.asd_expiration and self.asd_expiration < timezone.now():
            return False
        return True

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'cin', 'phone']

    def __str__(self):
        return f"{self.email} ({self.username})"

class SavedCard(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_cards')
    card_holder = models.CharField(max_length=200)
    last_4 = models.CharField(max_length=4)
    expiry = models.CharField(max_length=5) # MM/YY
    brand = models.CharField(max_length=20, default='Visa')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.brand} **** {self.last_4} ({self.user.email})"

