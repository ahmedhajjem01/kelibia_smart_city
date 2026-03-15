from django.urls import path
from . import views

urlpatterns = [
    path("add/", views.add_complaint),
    path("list/", views.get_complaints),
    path("", views.index),
]