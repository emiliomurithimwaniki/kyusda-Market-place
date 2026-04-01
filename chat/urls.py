from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('conversations/user/<int:user_id>/', views.GetOrCreateConversationView.as_view(), name='get_or_create_conversation'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='message_list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread_count'),
]
