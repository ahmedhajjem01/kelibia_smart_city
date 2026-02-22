from django.urls import path
from .views import RegisterView, CustomActivationView, UserProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('activation/', CustomActivationView.as_view(), name='activation'),
    path('me/', UserProfileView.as_view(), name='user-me'),
]
