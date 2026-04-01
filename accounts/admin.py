from django.contrib import admin

# Register your models here.

from .models import Follow, Profile, User


admin.site.register(User)
admin.site.register(Profile)
admin.site.register(Follow)
