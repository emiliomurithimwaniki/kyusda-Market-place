from django.db import models

# Create your models here.

class Notification(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=64)
    title = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    actor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications_sent')
    order = models.ForeignKey('marketplace.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='seller_notifications')
    product = models.ForeignKey('marketplace.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_notifications')
    image_url = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
