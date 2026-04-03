from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_phone = serializers.CharField(source='actor.phone', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'message',
            'is_read',
            'created_at',
            'actor',
            'actor_name',
            'actor_phone',
            'order',
            'product',
            'image_url',
            'data',
        ]
        read_only_fields = fields
