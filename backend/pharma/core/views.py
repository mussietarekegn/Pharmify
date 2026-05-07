from django.shortcuts import render
from rest_framework import viewsets
from .models import Medicine,Notification,User
from .serializers import MedicineSerializer,NotificationSerializer
from rest_framework.permissions import IsAuthenticated,AllowAny
from .permissions import IsOwner,IsVerifiedOwner
from django.db.models import Q
from rest_framework.decorators import api_view,permission_classes,action
from rest_framework.response import Response
from django.conf import settings
import google.generativeai as genai
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from .pagination import MedicinePagination
# Create your views here.

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
        queryset = Medicine.objects.all()

        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        category = self.request.query_params.get('category')
        location = self.request.query_params.get('location')
        sort = self.request.query_params.get('sort')

        user = self.request.user

        if location:
             queryset = queryset.filter(pharmacy__location__icontains=location)

        elif user.is_authenticated and user.latitude and user.longitude:
            queryset = queryset.filter(pharmacy__location__icontains="Addis")
        

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)|
                Q(description__icontains=search)
            )
        
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
    

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    

    @action(detail=True, methods=['POST'])
    def mark_as_read(self,request,pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()

        return Response({"message": "Notification marked as read"})


genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

@api_view(['POST'])
def ai_guide(request):
    symptoms = request.data.get('symptoms')

    if not symptoms:
        return Response(
            {'error': 'Symptoms are required'},
            status=400
        )
    
    prompt = f"""
    You are a medical assistant AI.

    The user symptoms are:
    {symptoms}

    Give:
    1. Possible condition
    2. Recommended medicine category
    3. Whether hospital visit is recommended

    IMPORTANT:
    - This is not professional medical advice.
    - Encourage doctor consultation for serious symptoms.
    - Keep response short and clear.
    """

    try:

        response = model.generate_content(prompt)

        return Response({
            "response": response.text
        })
    
    except Exception as e:
        return Response(
            {"error":str(e)},
            status=500
        )

@api_view(['POST'])
def google_login(request):
    token = request.data.get('token')

    if not token:
        return Response(
            {"error": "Token is required"},
            status = 400
        )
    
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
                'username':email,
                'first_name':name,
                'role': 'customer'
            }
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email': user.email,
                'username': user.username,
                'role': user.role,
            }

        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsVerifiedOwner])
def owner_dashboard(request):
    pharmacy = request.user.pharmacy
    medicines = Medicine.objects.filter(pharmacy=pharmacy)
    total_medicines = medicines.count()
    latest_medicines = medicines.order_by('-created_at')[:5]
    categories = medicines.values('category').annotate(
        total=Count('category')
    )

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