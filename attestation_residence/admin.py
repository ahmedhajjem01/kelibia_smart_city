from django.contrib import admin
from .models import DemandeResidence

@admin.register(DemandeResidence)
class DemandeResidenceAdmin(admin.ModelAdmin):
    list_display = ('citizen', 'profession', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('citizen__email', 'citizen__first_name', 'citizen__last_name', 'adresse_demandee', 'profession')
    
    fieldsets = (
        ('Informations Citoyen', {
            'fields': ('citizen', 'profession', 'telephone', 'adresse_demandee', 'motif_demande')
        }),
        ('Documents Justificatifs', {
            'fields': ('cin_recto', 'cin_verso', 'cin_copy', 'quitus_municipal', 'acte_deces_conjoint'),
        }),
        ('Traitement de la Demande', {
            'fields': ('status', 'issued_document', 'commentaire_agent'),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
