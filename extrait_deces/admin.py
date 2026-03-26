from django.contrib import admin
from .models import ExtraitDeces, DeclarationDeces
from django.utils.html import format_html

@admin.register(ExtraitDeces)
class ExtraitDecesAdmin(admin.ModelAdmin):
    list_display = ('defunt', 'annee_acte', 'numero_registre', 'created_at')
    search_fields = ('defunt__prenom_fr', 'defunt__nom_fr', 'numero_registre')

@admin.register(DeclarationDeces)
class DeclarationDecesAdmin(admin.ModelAdmin):
    list_display = ('defunt', 'declarant', 'date_deces', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('defunt__prenom_fr', 'defunt__nom_fr', 'declarant__email')
    readonly_fields = ('police_report_preview',)
    
    def police_report_preview(self, obj):
        if obj.police_report:
            if obj.police_report.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                return format_html('<img src="{}" style="max-height: 200px;"/>', obj.police_report.url)
            return format_html('<a href="{}" target="_blank">Voir le rapport (PDF/Fichier)</a>', obj.police_report.url)
        return "Aucun rapport"
    police_report_preview.short_description = "Aperçu du rapport de police"
