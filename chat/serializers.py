from rest_framework import serializers
from django.conf import settings
from .models import Conversation, Message
from accounts.models import User
from marketplace.models import Product

class UserChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    is_mine = serializers.SerializerMethodField()
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=12, decimal_places=2, read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    product_image_url = serializers.CharField(source='product.image', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender',
            'sender_name',
            'body',
            'product',
            'product_id',
            'product_title',
            'product_price',
            'product_image',
            'product_image_url',
            'is_read',
            'created_at',
            'is_mine'
        ]
        read_only_fields = ['sender', 'conversation']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserChatSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'other_participant', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return MessageSerializer(msg, context=self.context).data
        return None

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return UserChatSerializer(other).data
        return None
