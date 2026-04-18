from django.contrib import admin
from .models import DemandeImpot


@admin.register(DemandeImpot)
class DemandeImpotAdmin(admin.ModelAdmin):
    list_display = ['id', 'citizen', 'service_type', 'adresse_bien', 'status', 'is_paid', 'created_at']
    list_filter = ['status', 'service_type', 'is_paid']
    search_fields = ['citizen__email', 'citizen__first_name', 'citizen__last_name', 'adresse_bien']
    readonly_fields = ['created_at', 'updated_at']
