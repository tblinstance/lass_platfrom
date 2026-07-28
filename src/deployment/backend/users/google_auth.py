"""
Custom Google OAuth2 view.

Accepts a Google access_token from the frontend (obtained via @react-oauth/google
implicit flow or auth-code flow token exchange), verifies it with Google's
tokeninfo endpoint, then creates/retrieves the local User and returns JWTs.

Endpoint: POST /api/auth/google/
Body:      { "access_token": "<google_access_token>" }
Returns:   { "access": "<jwt>", "refresh": "<jwt>" }
"""

import requests
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class GoogleTokenLoginView(APIView):
    """
    Exchange a Google access_token for local JWT tokens.
    Works with both implicit and auth-code flows on the frontend.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"error": "access_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch user info from Google
        try:
            r = requests.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            r.raise_for_status()
            info = r.json()
        except requests.RequestException as e:
            logger.warning("Google userinfo fetch failed: %s", e)
            return Response({"error": "Failed to verify Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = info.get("email")
        if not email or not info.get("email_verified"):
            return Response({"error": "Google account email not verified."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create local user
        username = info.get("name", email.split("@")[0]).replace(" ", "_")[:150]
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": _unique_username(username),
                "avatar": info.get("picture", ""),
            },
        )

        if created:
            user.set_unusable_password()
            if info.get("picture") and not user.avatar:
                user.avatar = info["picture"]
            user.save()
        elif not user.avatar and info.get("picture"):
            user.avatar = info["picture"]
            user.save(update_fields=["avatar"])

        logger.info("Google login: %s (created=%s)", email, created)
        return Response(_tokens_for_user(user), status=status.HTTP_200_OK)


def _unique_username(base: str) -> str:
    """Ensure username is unique by appending a suffix if needed."""
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1
    return username
