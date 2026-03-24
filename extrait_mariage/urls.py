from django.urls import path
from . import views

urlpatterns = [
    path('<int:pk>/certificate/', views.wedding_certificate_view, name='wedding_certificate_ar'),
    path('<int:pk>/certificate/fr/', views.wedding_certificate_view, {'lang': 'fr'}, name='wedding_certificate_fr'),
    path('api/mes-mariages/', views.MesMariagesAPIView.as_view(), name='mes_mariages_api'),
    path('verify/<uuid:cert_uuid>/', views.verify_mariage_certificate_view, name='verify_certificate'),
    path('verify/<uuid:cert_uuid>/<str:lang>/', views.verify_mariage_certificate_view, name='verify_certificate_lang'),
]
