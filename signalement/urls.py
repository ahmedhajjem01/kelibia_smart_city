from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),
    path("dashboard/", views.dashboard),
    path("add/", views.add_complaint),
    path("list/", views.get_complaints),
]