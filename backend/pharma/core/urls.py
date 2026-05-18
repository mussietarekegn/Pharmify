from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicineViewSet, update_location, NotificationViewSet, ai_guide,
    google_login, owner_dashboard, PharmacyViewSet, my_favorites,
    toggle_favorite, create_order, my_orders, pharmacy_orders,
    add_to_cart, view_cart, remove_from_cart, medicine_reviews,
    add_review, admin_dashboard, verify_pharmacy, all_orders,
    recent_activity, update_order_status, top_medicines, register_user,
    CustomTokenObtainPairView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'pharmacies', PharmacyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('update-location/', update_location),
    path('ai-guide/', ai_guide),
    path('google-login/', google_login),
    path('owner/dashboard/', owner_dashboard),
    path('favorites/toggle/', toggle_favorite),
    path('favorites/', my_favorites),
    path('orders/my/', my_orders),
    path('orders/pharmacy/', pharmacy_orders),
    path('cart/add/', add_to_cart),
    path('cart/', view_cart),
    path('cart/remove/<int:item_id>/', remove_from_cart),
    path('orders/create/', create_order),
    path('reviews/add/', add_review),
    path('reviews/<int:medicine_id>/', medicine_reviews),
    path('admin/dashboard/', admin_dashboard),
    path('admin/verify-pharmacy/<int:pharmacy_id>/', verify_pharmacy),
    path('admin/orders/', all_orders),
    path('admin/recent-activity/', recent_activity),
    path('admin/orders/<int:order_id>/status/', update_order_status),
    path('top-medicines/', top_medicines),
    path('register/', register_user),
]