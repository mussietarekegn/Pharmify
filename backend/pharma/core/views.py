from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Medicine
from .serializers import MedicineSerializer

# Create your views here.

@api_view(['GET'])
def get_medicines(request):
    medicines = Medicine.objects.all()
    serializer = MedicineSerializer(medicines, many=True)
    return Response(serializer.data)
