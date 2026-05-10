from rest_framework import serializers
from .models import User, Pharmacy, Medicine, Notification,Favorite,Order,OrderItem,Cart,CartItem,Review

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
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ['pharmacy', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        request = self.context.get('request')

        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)

        return None
    
    def get_average_rating(self, obj):

        reviews = obj.reviews.all()

        if reviews.exists():

            total = sum(review.rating for review in reviews)

            return round(total / reviews.count(), 1)

        return 0
    
    def get_reviews_count(self, obj):
        return obj.reviews.count()
    

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

    medicine = MedicineSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'
    
class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class CartItemSerializer(serializers.ModelSerializer):

    medicine = MedicineSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'

    
class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = '__all__'
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, obj):

        total = 0

        for item in obj.items.all():
            total += item.medicine.price * item.quantity

        return total


class ReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review
        fields = '__all__'

    def validate_rating(self, value):

        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5"
            )

        return value