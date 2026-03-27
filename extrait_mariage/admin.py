from django.contrib import admin
from .models import ExtraitMariage, DemandeMariage

@admin.register(ExtraitMariage)
class ExtraitMariageAdmin(admin.ModelAdmin):
    list_display = ('epoux', 'epouse', 'annee_acte', 'date_mariage', 'type_acte')
    list_filter = ('type_acte', 'annee_acte', 'regime_matrimonial')
    search_fields = ('epoux__nom_fr', 'epouse__nom_fr', 'numero_registre')

@admin.register(DemandeMariage)
class DemandeMariageAdmin(admin.ModelAdmin):
    list_display = ('nom_epoux', 'nom_epouse', 'type_contrat', 'status', 'created_at')
    list_filter = ('status', 'type_contrat', 'regime_matrimonial')
    search_fields = ('nom_epoux', 'nom_epouse', 'cin_epoux', 'cin_epouse')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informations Générales', {
            'fields': ('citizen', 'type_contrat', 'status', 'commentaire_agent')
        }),
        ('Documents Notaire (Adouls)', {
            'fields': ('contrat_recu_scan',),
            'classes': ('collapse',),
            'description': 'Pour les mariages notaire, l\'agent télécharge ici le contrat envoyé par le notaire.'
        }),
        ('Époux (Groom)', {
            'fields': ('nom_epoux', 'cin_epoux', 'cin_recto_epoux', 'cin_verso_epoux', 'extrait_naissance_epoux', 'certificat_medical_epoux')
        }),
        ('Épouse (Bride)', {
            'fields': ('nom_epouse', 'cin_epouse', 'cin_recto_epouse', 'cin_verso_epouse', 'extrait_naissance_epouse', 'certificat_medical_epouse')
        }),
        ('Détails du Mariage', {
            'fields': ('date_souhaitee', 'regime_matrimonial', 'lieu_mariage')
        }),
        ('Horodatage', {
            'fields': ('created_at', 'updated_at')
        }),
    )
