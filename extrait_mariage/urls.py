from django.urls import path
from . import views

urlpatterns = [
    path('<int:pk>/certificate/', views.wedding_certificate_view, name='wedding_certificate_ar'),
    path('<int:pk>/certificate/fr/', views.wedding_certificate_view, {'lang': 'fr'}, name='wedding_certificate_fr'),
    path('api/mes-mariages/', views.MesMariagesAPIView.as_view(), name='mes_mariages_api'),
]
