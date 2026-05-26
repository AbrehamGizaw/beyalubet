from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.core import signing
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .models import User, SellerProfile, BuyerProfile
from .serializers import RegisterSerializer, UserSerializer, SellerProfileSerializer, BuyerProfileSerializer
from .email_utils import (
    send_welcome_and_verification,
    send_verification_email,
    send_password_reset_email,
    password_reset_generator,
    email_verification_generator,
)


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user.role == 'seller':
                SellerProfile.objects.create(
                    user=user,
                    business_name=f"{user.first_name or user.username}'s Store"
                )
            else:
                BuyerProfile.objects.create(user=user)

            send_welcome_and_verification(user)

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        user = request.user
        data = request.data

        if 'old_password' in data or 'new_password' in data:
            if not user.check_password(data.get('old_password', '')):
                return Response({'detail': 'Current password is incorrect.'}, status=400)
            new_pw = data.get('new_password', '')
            if len(new_pw) < 8:
                return Response({'detail': 'New password must be at least 8 characters.'}, status=400)
            user.set_password(new_pw)
            user.save()
            return Response({'detail': 'Password changed successfully.'})

        if 'profile_image' in request.FILES:
            user.profile_image = request.FILES['profile_image']

        for field in ('first_name', 'last_name', 'email', 'phone'):
            if field in data:
                setattr(user, field, data[field])
        user.save()

        if user.is_seller():
            profile, _ = SellerProfile.objects.get_or_create(user=user)
            seller_data = data.get('seller_profile', data)
            ps = SellerProfileSerializer(profile, data=seller_data, partial=True)
            if ps.is_valid():
                ps.save()
        elif user.is_buyer():
            profile, _ = BuyerProfile.objects.get_or_create(user=user)
            buyer_data = data.get('buyer_profile', data)
            ps = BuyerProfileSerializer(profile, data=buyer_data, partial=True)
            if ps.is_valid():
                ps.save()

        return Response(UserSerializer(user, context={'request': request}).data)


# ── Password reset ────────────────────────────────────────────────────────────

class ForgotPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)
        try:
            user = User.objects.get(email__iexact=email)
            send_password_reset_email(user)
        except User.DoesNotExist:
            pass  # Don't reveal whether an account exists
        return Response({'detail': 'If an account with that email exists, a reset link has been sent.'})


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not all([uid, token, new_password, confirm_password]):
            return Response({'detail': 'All fields are required.'}, status=400)
        if new_password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=400)
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=400)

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'detail': 'Invalid reset link.'}, status=400)

        if not password_reset_generator.check_token(user, token):
            return Response({'detail': 'Reset link is invalid or has expired.'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successfully. You can now log in.'})


# ── Email verification ────────────────────────────────────────────────────────

class VerifyEmailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'detail': 'Invalid verification link.'}, status=400)

        if user.is_email_verified:
            return Response({'detail': 'Email already verified.'})

        if not email_verification_generator.check_token(user, token):
            return Response({'detail': 'Verification link is invalid or has expired.'}, status=400)

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        return Response({'detail': 'Email verified successfully!'})


class ResendVerificationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response({'detail': 'Email already verified.'})
        if not user.email:
            return Response({'detail': 'No email address on your account.'}, status=400)
        send_verification_email(user)
        return Response({'detail': 'Verification email sent.'})


class UnsubscribeAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            data = signing.loads(token, salt='email-unsub', max_age=60 * 60 * 24 * 90)
            user = User.objects.get(pk=data['uid'])
            user.email_notifications = False
            user.save(update_fields=['email_notifications'])
            return Response({'success': True, 'email': user.email})
        except signing.SignatureExpired:
            return Response({'error': 'Unsubscribe link has expired. Please request a new email.'}, status=400)
        except Exception:
            return Response({'error': 'Invalid unsubscribe link.'}, status=400)
