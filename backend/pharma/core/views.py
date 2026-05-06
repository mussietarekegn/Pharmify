from django.shortcuts import render
from rest_framework import viewsets
from .models import Medicine
from .serializers import MedicineSerializer
from rest_framework.permissions import IsAuthenticated,AllowAny
from .permissions import IsOwner,IsVerifiedOwner

# Create your views here.

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVerifiedOwner()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        pharmacy = self.request.user.pharmacy
        serializer.save(pharmacy=pharmacy)
    