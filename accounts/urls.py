from django.urls import path
from .views import RegisterView, CustomActivationView, UserProfileView, AgentCitizenVerificationView, ResendActivationCodeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('activation/', CustomActivationView.as_view(), name='activation'),
    path('resend-activation/', ResendActivationCodeView.as_view(), name='resend-activation'),
    path('me/', UserProfileView.as_view(), name='user-me'),
    path('agent-citizens/', AgentCitizenVerificationView.as_view(), name='agent-citizens'),
]
