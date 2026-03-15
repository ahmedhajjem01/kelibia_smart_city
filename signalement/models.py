from django.contrib.gis.db import models

class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('voirie', 'Voirie'),
        ('eclairage', 'Éclairage public'),
        ('dechets', 'Déchets et propreté'),
        ('eau', 'Eau et assainissement'),
        ('espaces_verts', 'Espaces verts'),
        ('batiments', 'Bâtiments publics'),
        ('autre', 'Autre'),
    ]

    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('resolu', 'Résolu'),
        ('resolu_avec_retard', 'Résolu avec retard'),
        ('en_retard', 'En retard'),
    ]

    PRIORITY_CHOICES = [
        ('faible', 'Faible'),
        ('normale', 'Normale'),
        ('urgente', 'Urgente'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normale')
    photo = models.ImageField(upload_to='complaints/', blank=True, null=True)
    location = models.PointField()  # ← champ géospatial (remplace latitude/longitude)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_duplicate = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.category}"