from rest_framework import serializers

from accounts.models import User
from marketplace.models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.CharField(source="user.name", read_only=True)
    sellerId = serializers.IntegerField(source="user.id", read_only=True)
    category = serializers.CharField(source="category.name", read_only=True)

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
            "seller",
            "sellerId",
        ]


class ProductDetailSerializer(ProductSerializer):
    pass
