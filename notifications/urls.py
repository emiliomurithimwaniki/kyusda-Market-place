from django.urls import path

from notifications import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', views.NotificationUnreadCountView.as_view(), name='notification_unread_count'),
    path('<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification_mark_read'),
]
