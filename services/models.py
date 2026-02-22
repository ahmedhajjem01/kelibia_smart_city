from django.db import models

class Category(models.Model):
    name_fr = models.CharField(max_length=100, verbose_name="Nom (FR)")
    name_ar = models.CharField(max_length=100, verbose_name="Nom (AR)")
    icon = models.CharField(max_length=50, blank=True, help_text="FontAwesome icon class")

    def __str__(self):
        return self.name_fr

    class Meta:
        verbose_name_plural = "Categories"

class Service(models.Model):
    category = models.ForeignKey(Category, related_name='services', on_delete=models.CASCADE)
    name_fr = models.CharField(max_length=200, verbose_name="Nom du service (FR)")
    name_ar = models.CharField(max_length=200, verbose_name="Nom du service (AR)")
    description_fr = models.TextField(blank=True, verbose_name="Description (FR)")
    description_ar = models.TextField(blank=True, verbose_name="Description (AR)")
    processing_time = models.CharField(max_length=100, blank=True, verbose_name="Délai de traitement")

    def __str__(self):
        return self.name_fr

class Requirement(models.Model):
    service = models.ForeignKey(Service, related_name='requirements', on_delete=models.CASCADE)
    name_fr = models.CharField(max_length=200, verbose_name="Document requis (FR)")
    name_ar = models.CharField(max_length=200, verbose_name="Document requis (AR)")
    is_mandatory = models.BooleanField(default=True)

    def __str__(self):
        return self.name_fr
