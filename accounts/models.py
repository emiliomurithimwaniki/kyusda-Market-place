from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self, email, phone, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not phone:
            raise ValueError('Phone is required')

        email = self.normalize_email(email)
        user = self.model(email=email, phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email=email, phone=phone, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        BUYER = 'buyer', 'Buyer'
        SELLER = 'seller', 'Seller'
        BUSINESS = 'business', 'Business'
        ADMIN = 'admin', 'Admin'

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.BUYER)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone', 'name']

    def __str__(self):
        return f"{self.email}"


class Profile(models.Model):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='profile')
    image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)


class Follow(models.Model):
    follower = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='following')
    seller = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['follower', 'seller'], name='unique_follow_pair')
        ]
