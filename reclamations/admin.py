from django.contrib import admin
from .models import Reclamation

@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display = ('title', 'citizen', 'category', 'status', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'citizen__email')
    readonly_fields = ('created_at', 'updated_at')
