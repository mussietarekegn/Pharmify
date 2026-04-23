from django.urls import path
from .views import get_medicines

urlpatterns = [
    path('medicines/', get_medicines),
]