from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet,update_location,NotificationViewSet,ai_guide,google_login,owner_dashboard,PharmacyViewSet,my_favorites,toggle_favorite


router = DefaultRouter()
router.register(r'medicines',MedicineViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'pharmacies', PharmacyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('update-location/', update_location),
    path('ai-guide/', ai_guide),
    path('google-login/',google_login),
    path('owner/dashboard/', owner_dashboard),
    path('favorites/toggle/', toggle_favorite),
    path('favorites/', my_favorites)
]

