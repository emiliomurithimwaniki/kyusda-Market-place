from rest_framework import serializers
from django.conf import settings
from .models import Conversation, Message
from accounts.models import User

class UserChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    is_mine = serializers.SerializerMethodField()
    conversation = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'body', 'is_read', 'created_at', 'is_mine']
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
