from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Profile
from .serializers import ProfileSerializer
import logging

logger = logging.getLogger(__name__)

class ProfileViewSet(viewsets.ViewSet):
    """
    ViewSet for interacting with profiles.
    Supports list, retrieve, create, update, partial_update, and destroy.
    """
    lookup_field = 'name'

    def list(self, request):
        try:
            with TblincClient() as client:
                profiles_data = client.list_profiles(recursion=1)
                serialized = serialize_data(Profile, ProfileSerializer, profiles_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list profiles")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, name=None):
        try:
            with TblincClient() as client:
                profile_data = client.get_profile(name)
                serialized = serialize_data(Profile, ProfileSerializer, profile_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get profile {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            with TblincClient() as client:
                result = client.create_profile(request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to create profile")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.update_profile(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update profile {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.patch_profile(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch profile {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, name=None):
        try:
            with TblincClient() as client:
                client.delete_profile(name)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete profile {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
