from rest_framework import serializers

from accounts.models import User
from marketplace.models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class SellerSerializer(serializers.ModelSerializer):
    follower_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = User
        fields = ["id", "name", "follower_count"]


class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.CharField(source="user.name", read_only=True)
    sellerId = serializers.IntegerField(source="user.id", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.CharField(source="image", required=False, allow_blank=True, allow_null=True)
    offer_active = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "location",
            "created_at",
            "is_approved",
            "featured",
            "category",
            "category_name",
            "image",
            "image_url",
            "photos",
            "stock",
            "offer_price",
            "offer_start",
            "offer_end",
            "offer_active",
            "seller",
            "sellerId",
        ]
        read_only_fields = ["is_approved", "featured", "image"]

    def validate(self, attrs):
        # Allow image to be null in initial validation since it's an ImageField
        # We will handle the URL string manually in the view
        return attrs

    def get_offer_active(self, obj):
        from django.utils import timezone

        if not obj.offer_price or not obj.offer_start or not obj.offer_end:
            return False
        now = timezone.now()
        return obj.offer_start <= now <= obj.offer_end


class ProductDetailSerializer(ProductSerializer):
    pass
