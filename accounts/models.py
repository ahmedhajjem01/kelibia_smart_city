from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    VALIDATION_CHOICES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
    ]

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

    cin = models.CharField(max_length=8, unique=True, verbose_name="Numéro CIN")
    phone = models.CharField(max_length=8, unique=True, verbose_name="Numéro de Téléphone")
    address = models.TextField(verbose_name="Adresse")
    governorate = models.CharField(max_length=50, choices=GOVERNORATE_CHOICES, verbose_name="Gouvernorat", default='Nabeul')
    city = models.CharField(max_length=100, verbose_name="Ville", default='Kelibia')
    validation_method = models.CharField(
        max_length=5, 
        choices=VALIDATION_CHOICES, 
        default='email',
        verbose_name="Méthode de validation"
    )
    otp_code = models.CharField(max_length=6, blank=True, null=True, verbose_name="Code OTP")
    is_verified = models.BooleanField(default=False, verbose_name="Est vérifié")

    def __str__(self):
        return f"{self.username} ({self.cin})"
