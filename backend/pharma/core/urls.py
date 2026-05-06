from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet,update_location,NotificationViewSet,ai_guide,google_login


router = DefaultRouter()
router.register(r'medicines',MedicineViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('update-location/', update_location),
    path('ai-guide/', ai_guide),
    path('google-login/',google_login),
]

