from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'cin', 'phone', 'user_type', 'is_verified', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('cin', 'phone', 'address', 'governorate', 'city', 'user_type', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('cin', 'phone', 'address', 'governorate', 'city', 'user_type', 'is_verified')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
