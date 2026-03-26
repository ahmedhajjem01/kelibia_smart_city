from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

from django.utils.html import format_html

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'cin', 'phone', 'user_type', 'is_verified', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('cin', 'phone', 'address', 'governorate', 'city', 'user_type', 'is_verified')}),
        ('Documents CIN', {'fields': ('cin_front_image', 'cin_front_preview', 'cin_back_image', 'cin_back_preview')}),
    )
    readonly_fields = ['cin_front_preview', 'cin_back_preview']
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('cin', 'phone', 'address', 'governorate', 'city', 'user_type', 'is_verified')}),
    )

    @admin.display(description="Aperçu CIN Avant")
    def cin_front_preview(self, obj):
        if obj.cin_front_image:
            return format_html('<img src="{}" style="max-height: 200px; border: 1px solid #ccc;" />', obj.cin_front_image.url)
        return "Aucune image"

    @admin.display(description="Aperçu CIN Arrière")
    def cin_back_preview(self, obj):
        if obj.cin_back_image:
            return format_html('<img src="{}" style="max-height: 200px; border: 1px solid #ccc;" />', obj.cin_back_image.url)
        return "Aucune image"

admin.site.register(CustomUser, CustomUserAdmin)
