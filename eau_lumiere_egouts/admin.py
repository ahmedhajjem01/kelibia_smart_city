from django.contrib import admin
from .models import DemandeEau


@admin.register(DemandeEau)
class DemandeEauAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'service_type', 'adresse', 'status', 'is_paid', 'created_at']
    list_filter = ['status', 'service_type', 'is_paid']
    search_fields = ['citizen__email', 'citizen__first_name', 'citizen__last_name', 'adresse']
    readonly_fields = ['created_at', 'updated_at']
