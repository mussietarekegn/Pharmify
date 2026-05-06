from django.shortcuts import render
from rest_framework import viewsets
from .models import Medicine
from .serializers import MedicineSerializer
from rest_framework.permissions import IsAuthenticated,AllowAny
from .permissions import IsOwner,IsVerifiedOwner
from django.db.models import Q
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response

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
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

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
        serializer.save(pharmacy=pharmacy)
    