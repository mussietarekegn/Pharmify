from rest_framework import serializers
from .models import User, Pharmacy, Medicine, Notification,Favorite,Order,OrderItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone']

class PharmacySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    license_document_url = serializers.SerializerMethodField()

    class Meta:
        model = Pharmacy
        fields = '__all__'
    
    def get_license_document_url(self, obj):
        request = self.context.get('request')

        if obj.license_document and request:
            return request.build_absolute_uri(
                obj.license_document.url
            )
    
        return None


class MedicineSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        request = self.context.get('request')

        if obj.image and request:
            return request.build_absolute_url(obj.image.url)

        return None
    

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class FavoriteSerializer(serializers.ModelSerializer):
    medicine_detail = MedicineSerializer(source='medicine', read_only=True)

    class Meta:
        model = Favorite
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):

    medicine_detail = MedicineSerializer(
        source='medicine',
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = '__all__'
    
class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'