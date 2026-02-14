from django.urls import path
from .views import VerifySMSView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-sms/', VerifySMSView.as_view(), name='verify_sms'),
]
