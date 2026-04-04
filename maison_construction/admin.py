from django.contrib import admin
from .models import DemandeConstruction, DemandeGoudronnage, DemandeCertificatVocation


@admin.register(DemandeConstruction)
class DemandeConstructionAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'type_travaux', 'adresse_terrain', 'status', 'priorite', 'is_high_risk', 'created_at']
    list_filter = ['status', 'priorite', 'type_travaux', 'usage_batiment', 'is_high_risk', 'is_paid']
    search_fields = ['citizen__email', 'citizen__first_name', 'citizen__last_name', 'adresse_terrain', 'numero_parcelle']
    readonly_fields = ['citizen', 'created_at', 'updated_at', 'is_high_risk']
    fieldsets = (
        ('Demandeur', {'fields': ('citizen',)}),
        ('Terrain', {'fields': ('adresse_terrain', 'numero_parcelle', 'latitude', 'longitude')}),
        ('Travaux', {'fields': ('type_travaux', 'type_travaux_libre', 'usage_batiment', 'description_travaux')}),
        ('Dimensions & Planning', {'fields': ('surface_terrain', 'surface_construite', 'nombre_etages', 'hauteur_max', 'date_debut_prevue', 'duree_travaux_mois', 'cout_estime')}),
        ('Propriétaire', {'fields': ('nom_proprietaire', 'cin_proprietaire', 'telephone_proprietaire')}),
        ('Entrepreneur', {'fields': ('nom_entrepreneur', 'telephone_entrepreneur')}),
        ('Documents', {'fields': ('titre_foncier', 'plan_architectural', 'photo_terrain', 'devis_estimatif', 'cin_proprietaire_recto', 'cin_proprietaire_verso')}),
        ('Statut', {'fields': ('status', 'priorite', 'commentaire_agent', 'permis_signe', 'is_paid', 'is_high_risk')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(DemandeGoudronnage)
class DemandeGoudronnageAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'nom_prenom', 'adresse_residence', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['citizen__email', 'nom_prenom', 'adresse_residence', 'cin']
    readonly_fields = ['citizen', 'created_at', 'updated_at']
    fieldsets = (
        ('Demandeur', {'fields': ('citizen', 'nom_prenom', 'cin')}),
        ('Localisation', {'fields': ('adresse_residence', 'localisation_rue', 'latitude', 'longitude')}),
        ('Documents', {'fields': ('cin_copie',)}),
        ('Statut', {'fields': ('status', 'commentaire_agent')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(DemandeCertificatVocation)
class DemandeCertificatVocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'nom_prenom', 'adresse_bien', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['citizen__email', 'nom_prenom', 'adresse_bien', 'cin']
    readonly_fields = ['citizen', 'created_at', 'updated_at']
    fieldsets = (
        ('Demandeur', {'fields': ('citizen', 'nom_prenom', 'cin')}),
        ('Bien immobilier', {'fields': ('adresse_bien',)}),
        ('Documents', {'fields': ('cin_copie', 'quitus', 'certificat_propriete', 'plan_cadastral', 'plan_situation')}),
        ('Statut', {'fields': ('status', 'commentaire_agent', 'certificat_signe')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )
