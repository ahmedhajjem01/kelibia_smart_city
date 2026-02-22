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
    ]

    email = models.EmailField(unique=True, blank=False, verbose_name="Adresse Email")
    cin = models.CharField(max_length=8, unique=True, verbose_name="Numéro CIN")
    phone = models.CharField(max_length=8, unique=True, verbose_name="Numéro de Téléphone")
    address = models.TextField(verbose_name="Adresse")
    governorate = models.CharField(max_length=50, choices=GOVERNORATE_CHOICES, verbose_name="Gouvernorat", default='Nabeul')
    city = models.CharField(max_length=100, verbose_name="Ville", default='Kelibia')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='citizen', verbose_name="Type d'utilisateur")
    is_verified = models.BooleanField(default=False, verbose_name="Est vérifié")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'cin', 'phone']

    def __str__(self):
        return f"{self.email} ({self.username})"
