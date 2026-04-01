from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import IntegrityError
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

import random
from datetime import timedelta

from accounts.models import PendingRegistration, Profile
from accounts.serializers import (
    EmailVerifiedTokenObtainPairSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
)

# Create your views here.

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists() or PendingRegistration.objects.filter(email=data['email']).exists():
            raise IntegrityError('Email already exists')
        if User.objects.filter(phone=data['phone']).exists() or PendingRegistration.objects.filter(phone=data['phone']).exists():
            raise IntegrityError('Phone already exists')

        pending = PendingRegistration.objects.create(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            role=data.get('role') or User.Role.BUYER,
            password_hash=make_password(data['password']),
            verification_code_hash='',
            verification_code_expires_at=timezone.now(),
        )
        _send_verification_email(pending)

class MeView(generics.GenericAPIView):
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        return Response(self.get_serializer(request.user).data)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


User = get_user_model()


def _send_verification_email(pending):
    code = f"{random.randint(0, 999999):06d}"
    pending.verification_code_hash = make_password(code)
    pending.verification_code_expires_at = timezone.now() + timedelta(minutes=15)
    pending.save(update_fields=['verification_code_hash', 'verification_code_expires_at'])

    send_mail(
        subject='Verify your KYUSDA account email',
        message=f"Your KYUSDA verification code is: {code}. This code expires in 15 minutes.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'no-reply@kyusda.local',
        recipient_list=[pending.email],
        fail_silently=False,
    )


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'detail': 'email and code are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response({'detail': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)

        if pending.verification_code_expires_at and pending.verification_code_expires_at < timezone.now():
            return Response({'detail': 'Verification code expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not pending.verification_code_hash or not check_password(str(code), pending.verification_code_hash):
            return Response({'detail': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=pending.email).exists() or User.objects.filter(phone=pending.phone).exists():
            pending.delete()
            return Response({'detail': 'Account already exists. Please login.'})

        user = User.objects.create(
            name=pending.name,
            email=pending.email,
            phone=pending.phone,
            role=pending.role,
            is_email_verified=True,
            email_verified_at=timezone.now(),
        )
        user.password = pending.password_hash
        user.save(update_fields=['password'])
        Profile.objects.get_or_create(user=user)

        pending.delete()

        return Response({'detail': 'Email verified successfully. Account created.'})


class ResendVerificationEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response({'detail': 'If the account exists, a verification email has been sent.'})

        _send_verification_email(pending)
        return Response({'detail': 'Verification code sent'})


class EmailVerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailVerifiedTokenObtainPairSerializer
