from django.urls import path
from . import views

app_name = 'extrait_deces'

urlpatterns = [
    path('api/mes-deces/', views.MesDecesAPIView.as_view(), name='api-mes-deces'),
    path('api/declaration/', views.DeclarationDecesAPIView.as_view(), name='api-declaration-deces'),
    path('api/inhumation/', views.DemandeInhumationAPIView.as_view(), name='api-inhumation'),
    path('<int:pk>/certificate/', views.deces_certificate_view, name='deces-certificate'),
    path('<int:pk>/certificate/fr/', views.deces_certificate_view, {'lang': 'fr'}, name='deces-certificate-fr'),
    path('verify/<uuid:cert_uuid>/', views.verify_deces_view, name='verify-deces'),
    path('verify/<uuid:cert_uuid>/<str:lang>/', views.verify_deces_view, name='verify_deces_lang'),
]
