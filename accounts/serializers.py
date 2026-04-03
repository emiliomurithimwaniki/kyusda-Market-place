from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import Profile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)

    def create(self, validated_data):
        raise NotImplementedError()


class UserSerializer(serializers.ModelSerializer):
    orders_count = serializers.SerializerMethodField()
    earnings = serializers.DecimalField(source='profile.earnings', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'created_at', 'orders_count', 'earnings']

    def get_orders_count(self, obj):
        return obj.orders.count() if hasattr(obj, 'orders') else 0


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.CharField(source='user.name', required=False)
    phone = serializers.CharField(source='user.phone', required=False)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'name', 'phone', 'image', 'bio', 'location']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {}) if isinstance(validated_data, dict) else {}
        if user_data:
            user = instance.user
            if 'name' in user_data:
                user.name = user_data['name']
            if 'phone' in user_data:
                user.phone = user_data['phone']
            user.save(update_fields=['name', 'phone'])

        return super().update(instance, validated_data)


class EmailVerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not getattr(self.user, 'is_email_verified', False):
            raise serializers.ValidationError({'detail': 'Please verify your email before logging in.'})
        return data
