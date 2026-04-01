from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        Profile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    orders_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'created_at', 'orders_count']

    def get_orders_count(self, obj):
        return obj.orders.count() if hasattr(obj, 'orders') else 0


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'image', 'bio', 'location']
