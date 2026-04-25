from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import MyTokenObtainPairView, admin_logout, SavedCardView, UserVerificationView, AdminUserCreateView, ConfigView
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import login_redirect, confirm_payment, get_supervisor_services_summary, manage_supervisor_orders

urlpatterns = [
    path('admin/logout/', admin_logout, name='admin_logout'),
    path('admin/', admin.site.urls),
    path('api/payments/confirm/', confirm_payment, name='confirm_payment'),
    path('api/accounts/cards/', SavedCardView.as_view(), name='saved_cards'),
    path('api/accounts/verify-citizens/', UserVerificationView.as_view(), name='verify_citizens'),
    path('api/accounts/admin-create/', AdminUserCreateView.as_view(), name='admin_create_user'),
    path('api/accounts/config/', ConfigView.as_view(), name='site_config'),



    path('api/', include('djoser.urls')),
    path('api/', include('djoser.urls.jwt')),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/services/', include('services.urls')),
    path('api/reclamations/', include('reclamations.urls')),
    path('api/news/', include('news.urls')),
    path('extrait-naissance/', include('extrait_naissance.urls')),
    path('extrait-mariage/', include('extrait_mariage.urls')),
    path('extrait-deces/', include('extrait_deces.urls')),
    path('api/residence/', include('attestation_residence.urls')),
    path('api/evenements/', include('social_evenements.urls')),
    path('api/forum/', include('forum.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('login/', login_redirect, name='login'),
    path('api/construction/', include('maison_construction.urls')),
    path('livret-famille/', include('livret_famille.urls')),
    path('api/eau/', include('eau_lumiere_egouts.urls')),
    path('api/impots/', include('argent_impots.urls')),
    path('api/commerce/', include('boutiques_commerces.urls')),
    path('api/supervisor/services-summary/', get_supervisor_services_summary, name='supervisor_services_summary'),
    path('api/supervisor/manage-orders/', manage_supervisor_orders, name='manage_supervisor_orders'),
    path('api/supervisor/manage-orders/<str:order_type>/<int:order_id>/', manage_supervisor_orders, name='manage_supervisor_order_detail'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)