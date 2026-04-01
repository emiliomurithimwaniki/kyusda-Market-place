from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, UserChatSerializer
from accounts.models import User

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user
        )

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = Conversation.objects.get(id=conversation_id, participants=self.request.user)
        serializer.save(sender=self.request.user, conversation=conversation)

class GetOrCreateConversationView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if int(user_id) == request.user.id:
            return Response({"detail": "Cannot chat with yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find conversation with exactly these two participants
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=user_id).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, user_id)
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)

class UnreadCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})
