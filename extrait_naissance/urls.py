from django.urls import path
from . import views

app_name = 'extrait_naissance'

urlpatterns = [
    path('api/mes-extraits/', views.MesExtraitsAPIView.as_view(), name='api_mes_extraits'),
    path('api/declaration/', views.DeclarationNaissanceAPIView.as_view(), name='api_declaration_naissance'),
    path('api/declaration/<int:pk>/', views.DeclarationNaissanceDetailAPIView.as_view(), name='api_declaration_naissance_detail'),
    path('api/legalisation/', views.DemandeLegalisationAPIView.as_view(), name='api_legalisation'),
    path('api/demande-extrait/', views.DemandeExtraitNaissanceAPIView.as_view(), name='api_demande_extrait'),
    path('api/demande-extrait/<int:pk>/', views.DemandeExtraitNaissanceDetailAPIView.as_view(), name='api_demande_extrait_detail'),
    path('<int:pk>/certificate/', views.certificate_view, {'lang': 'ar'}, name='certificate_ar'),
    path('<int:pk>/certificate/<str:lang>/', views.certificate_view, name='certificate_lang'),
    path('verify/<uuid:cert_uuid>/', views.verify_birth_certificate_view, name='verify_certificate'),
]
