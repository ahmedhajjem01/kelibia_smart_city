from django.contrib import admin
from .models import DemandeEvenement


@admin.register(DemandeEvenement)
class DemandeEvenementAdmin(admin.ModelAdmin):
    list_display = [
        'titre_evenement', 'type_evenement', 'nom_organisateur',
        'date_debut', 'date_fin', 'lieu_type', 'status', 'has_conflict', 'is_paid', 'created_at'
    ]
    list_filter = ['status', 'type_evenement', 'lieu_type', 'has_conflict', 'is_paid']
    search_fields = ['titre_evenement', 'nom_organisateur', 'cin_organisateur', 'description']
    readonly_fields = ['has_conflict', 'conflict_with', 'created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ("Événement", {
            'fields': ('titre_evenement', 'type_evenement', 'description', 'nombre_participants')
        }),
        ("Lieu & Dates", {
            'fields': ('lieu_type', 'lieu_details', 'latitude', 'longitude',
                       'date_debut', 'date_fin', 'heure_debut', 'heure_fin')
        }),
        ("Organisateur", {
            'fields': ('citizen', 'nom_organisateur', 'cin_organisateur',
                       'telephone_organisateur', 'association_nom')
        }),
        ("Documents", {
            'fields': ('cin_recto', 'cin_verso', 'plan_lieu', 'programme_evenement',
                       'attestation_assurance', 'plan_securite', 'attestation_association')
        }),
        ("Gestion Agent", {
            'fields': ('status', 'commentaire_agent', 'autorisation_signee', 'is_paid')
        }),
        ("Conflits", {
            'fields': ('has_conflict', 'conflict_with')
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
