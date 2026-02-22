from django.contrib import admin
from .models import Category, Service, Requirement

class RequirementInline(admin.TabularInline):
    model = Requirement
    extra = 1

class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name_fr', 'category', 'processing_time']
    list_filter = ['category']
    inlines = [RequirementInline]

admin.site.register(Category)
admin.site.register(Service, ServiceAdmin)
