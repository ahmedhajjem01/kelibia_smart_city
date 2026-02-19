from django.urls import path
from .views import RegisterView, CustomActivationView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('activation/', CustomActivationView.as_view(), name='activation'),
]
