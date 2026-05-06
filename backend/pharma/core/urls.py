from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet,update_location


router = DefaultRouter()
router.register(r'medicines',MedicineViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('update-location/', update_location),
]

