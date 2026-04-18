from django.contrib import admin
from .models import DemandeCommerce


@admin.register(DemandeCommerce)
class DemandeCommerceAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'service_type', 'nom_commerce', 'adresse_commerce', 'status', 'is_paid', 'created_at']
    list_filter = ['status', 'service_type', 'is_paid']
    search_fields = ['citizen__email', 'citizen__first_name', 'citizen__last_name', 'nom_commerce', 'adresse_commerce']
    readonly_fields = ['created_at', 'updated_at']
