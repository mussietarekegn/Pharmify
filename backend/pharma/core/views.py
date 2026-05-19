from django.shortcuts import render
from rest_framework import viewsets
from .models import Medicine, Notification, User, Pharmacy, Favorite, OrderItem, Order, Cart, CartItem, Review
from .serializers import (
    MedicineSerializer, NotificationSerializer, PharmacySerializer,
    FavoriteSerializer, OrderItemSerializer, OrderSerializer,
    CartSerializer, ReviewSerializer, RegisterSerializer,
    CustomTokenObtainPairSerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwner, IsVerifiedOwner, IsAdmin
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.conf import settings
import google.generativeai as genai
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count
from .pagination import MedicinePagination
from rest_framework.exceptions import PermissionDenied
from django.contrib.postgres.search import TrigramSimilarity

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


DEFAULT_LAT = 9.0320
DEFAULT_LNG = 38.7469


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_location(request):
    user = request.user
    lat = request.data.get('latitude')
    lng = request.data.get('longitude')

    if lat is not None and lng is not None:
        user.latitude = lat
        user.longitude = lng
    else:
        user.latitude = DEFAULT_LAT
        user.longitude = DEFAULT_LNG

    user.save()
    return Response({
        "message": "Location saved",
        "latitude": user.latitude,
        "longitude": user.longitude
    })


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.select_related('pharmacy').all()
    serializer_class = MedicineSerializer
    pagination_class = MedicinePagination

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = Medicine.objects.select_related('pharmacy').prefetch_related('reviews')

        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        category = self.request.query_params.get('category')
        location = self.request.query_params.get('location')
        sort = self.request.query_params.get('sort')
        user = self.request.user

        if location:
            queryset = queryset.filter(pharmacy__location__icontains=location)

        if search:
            queryset = queryset.annotate(
                similarity=TrigramSimilarity('name', search)
            ).filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(similarity__gt=0.15)
            ).order_by('-similarity')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        if category:
            queryset = queryset.filter(category__icontains=category)

        if sort == 'price_low':
            queryset = queryset.order_by('price')
        elif sort == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVerifiedOwner()]
        return [AllowAny()]

    def perform_create(self, serializer):
        pharmacy = self.request.user.pharmacy
        medicine = serializer.save(pharmacy=pharmacy)
        customers = User.objects.filter(role='customer')
        notifications = [
            Notification(user=user, message=f"New medicine added: {medicine.name}")
            for user in customers
        ]
        Notification.objects.bulk_create(notifications)

    def perform_update(self, serializer):
        medicine = self.get_object()
        if medicine.pharmacy.owner != self.request.user:
            raise PermissionDenied("You do not own this medicine")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.pharmacy.owner != self.request.user:
            raise PermissionDenied("You do not own this medicine")
        instance.delete()


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['POST'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read"})


class PharmacyViewSet(viewsets.ModelViewSet):
    queryset = Pharmacy.objects.select_related('owner').all()
    serializer_class = PharmacySerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOwner()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        pharmacy = self.get_object()
        if pharmacy.owner != self.request.user:
            raise PermissionDenied("You do not own this pharmacy")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            raise PermissionDenied("You do not own this pharmacy")
        instance.delete()


genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")


@api_view(['POST'])
def ai_guide(request):
    symptoms = request.data.get('symptoms')

    if not symptoms:
        return Response({'error': 'Symptoms are required'}, status=400)

    prompt = f"""
    You are a medical assistant AI.

    Symptoms:
    {symptoms}

    Give:
    1. Possible condition
    2. Recommended medicine category
    3. Whether hospital visit is recommended
    """

    try:
        response = model.generate_content(prompt)
        return Response({"response": response.text, "ai_powered": True})

    except Exception as e:
        fallback_response = f"""
ERROR: {str(e)}

Possible condition:
- Common cold
- Mild flu
- Fever-related illness

Recommended medicine category:
- Pain relievers
- Fever reducers
- Hydration support

Hospital visit:
- Recommended if symptoms worsen or continue.

Symptoms entered:
{symptoms}
"""
        return Response({
            "response": fallback_response,
            "ai_powered": False,
            "message": "Fallback response used because AI service is unavailable."
        })


@api_view(['POST'])
def google_login(request):
    token = request.data.get('token')

    if not token:
        return Response({"error": "Token is required"}, status=400)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get('email')
        name = idinfo.get('name')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': name,
                'role': 'customer'
            }
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'phone': user.phone,
            }
        })

    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVerifiedOwner])
def owner_dashboard(request):
    pharmacy = request.user.pharmacy
    medicines = Medicine.objects.filter(pharmacy=pharmacy)
    total_medicines = medicines.count()
    latest_medicines = medicines.order_by('-created_at')[:5]
    categories = medicines.values('category').annotate(total=Count('category'))

    return Response({
        "pharmacy": pharmacy.name,
        "location": pharmacy.location,
        "verified": pharmacy.is_verified,
        "total_medicines": total_medicines,
        "latest_medicines": [
            {
                "id": medicine.id,
                "name": medicine.name,
                "price": medicine.price,
                "category": medicine.category,
            }
            for medicine in latest_medicines
        ],
        "categories": list(categories)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request):
    user = request.user
    medicine_id = request.data.get('medicine_id')

    favorite, created = Favorite.objects.get_or_create(
        user=user,
        medicine_id=medicine_id
    )

    if not created:
        favorite.delete()
        return Response({"message": "Removed from favorites"})

    return Response({"message": "Added to favorites"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_favorites(request):
    favorites = Favorite.objects.filter(user=request.user)
    serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        cart = request.user.cart
    except Cart.DoesNotExist:
        return Response({"error": "Cart is empty"}, status=400)

    cart_items = cart.items.all()

    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    order = Order.objects.create(user=request.user, total_price=0)
    total = 0

    for item in cart_items:
        if item.medicine.stock < item.quantity:
            return Response(
                {"error": f"Not enough stock for {item.medicine.name}"},
                status=400
            )

        OrderItem.objects.create(
            order=order,
            medicine=item.medicine,
            quantity=item.quantity,
            price=item.medicine.price
        )

        item.medicine.stock -= item.quantity
        item.medicine.save()

        if item.medicine.stock < 5:
            Notification.objects.create(
                user=item.medicine.pharmacy.owner,
                message=f"Low stock alert: {item.medicine.name}"
            )

        total += item.medicine.price * item.quantity

    order.total_price = total
    order.save()
    cart_items.delete()

    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVerifiedOwner])
def pharmacy_orders(request):
    pharmacy = request.user.pharmacy
    orders = Order.objects.filter(items__medicine__pharmacy=pharmacy).distinct()
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    medicine_id = request.data.get('medicine_id')
    quantity = int(request.data.get('quantity', 1))

    if quantity <= 0:
        return Response({"error": "Quantity must be greater than 0"}, status=400)

    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return Response({"error": "Medicine not found"}, status=404)

    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, medicine=medicine)

    if not created:
        cart_item.quantity += quantity
    else:
        cart_item.quantity = quantity

    cart_item.save()
    return Response({"message": "Medicine added to cart"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    try:
        item = CartItem.objects.get(id=item_id, cart__user=request.user)
        item.delete()
        return Response({"message": "Item removed"})
    except CartItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_review(request):
    medicine_id = request.data.get('medicine_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment')

    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return Response({"error": "Medicine not found"}, status=404)

    if int(rating) < 1 or int(rating) > 5:
        return Response({"error": "Rating must be between 1 and 5"}, status=400)

    review, created = Review.objects.update_or_create(
        user=request.user,
        medicine=medicine,
        defaults={'rating': rating, 'comment': comment}
    )

    serializer = ReviewSerializer(review)
    return Response(serializer.data)


@api_view(['GET'])
def medicine_reviews(request, medicine_id):
    reviews = Review.objects.filter(medicine_id=medicine_id).order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    total_users = User.objects.count()
    total_customers = User.objects.filter(role='customer').count()
    total_owners = User.objects.filter(role='owner').count()
    total_pharmacies = Pharmacy.objects.count()
    verified_pharmacies = Pharmacy.objects.filter(is_verified=True).count()
    total_medicines = Medicine.objects.count()
    total_orders = Order.objects.count()
    total_sales = sum(order.total_price for order in Order.objects.all())

    return Response({
        "total_users": total_users,
        "total_customers": total_customers,
        "total_owners": total_owners,
        "total_pharmacies": total_pharmacies,
        "verified_pharmacies": verified_pharmacies,
        "total_medicines": total_medicines,
        "total_orders": total_orders,
        "total_sales": total_sales,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def verify_pharmacy(request, pharmacy_id):
    try:
        pharmacy = Pharmacy.objects.get(id=pharmacy_id)
    except Pharmacy.DoesNotExist:
        return Response({"error": "Pharmacy not found"}, status=404)

    pharmacy.is_verified = True
    pharmacy.save()
    return Response({"message": "Pharmacy verified"})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def all_orders(request):
    orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def recent_activity(request):
    latest_users = User.objects.order_by('-date_joined')[:5]
    latest_orders = Order.objects.order_by('-created_at')[:5]
    latest_medicines = Medicine.objects.order_by('-created_at')[:5]

    return Response({
        "latest_users": [
            {"id": user.id, "username": user.username, "role": user.role}
            for user in latest_users
        ],
        "latest_orders": [
            {"id": order.id, "user": order.user.username, "total_price": order.total_price, "status": order.status}
            for order in latest_orders
        ],
        "latest_medicines": [
            {"id": medicine.id, "name": medicine.name, "price": medicine.price}
            for medicine in latest_medicines
        ]
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_order_status(request, order_id):
    status = request.data.get('status')

    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    allowed_statuses = ['pending', 'confirmed', 'delivered', 'cancelled']

    if status not in allowed_statuses:
        return Response({"error": "Invalid status"}, status=400)

    order.status = status
    order.save()
    return Response({"message": "Order status updated"})


@api_view(['GET'])
def top_medicines(request):
    medicines = Medicine.objects.annotate(
        review_count=Count('reviews')
    ).order_by('-review_count')[:10]

    serializer = MedicineSerializer(medicines, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "phone": user.phone,
            }
        })

    return Response(serializer.errors, status=400)