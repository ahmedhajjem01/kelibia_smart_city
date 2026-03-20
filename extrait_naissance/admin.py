from django.contrib import admin
from .models import Citoyen, ExtraitNaissance

@admin.register(Citoyen)
class CitoyenAdmin(admin.ModelAdmin):
    list_display = ('n_etat_civil', 'prenom_fr', 'nom_fr', 'date_naissance', 'sexe', 'pere', 'mere')
    search_fields = ('n_etat_civil', 'cin', 'prenom_fr', 'nom_fr', 'prenom_ar', 'nom_ar')
    list_filter = ('sexe',)

@admin.register(ExtraitNaissance)
class ExtraitNaissanceAdmin(admin.ModelAdmin):
    list_display = ('get_titulaire_name', 'numero_registre', 'annee_acte', 'date_declaration')
    search_fields = ('titulaire__prenom_fr', 'titulaire__nom_fr', 'numero_registre')
    list_filter = ('annee_acte',)
    
    def get_titulaire_name(self, obj):
        return f"{obj.titulaire.prenom_fr} {obj.titulaire.nom_fr}"
    get_titulaire_name.short_description = 'Titulaire'
