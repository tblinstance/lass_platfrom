from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from .models import Configuration
from .serializers import ConfigurationSerializer
import logging
import json

logger = logging.getLogger(__name__)

class ConfigurationViewSet(viewsets.ViewSet):
    """
    ViewSet for reading and updating the Incus server configuration.
    Supports list (GET all config) and patch_config (PATCH to update).
    """
    def list(self, request):
        try:
            with TblincClient() as client:
                config_data = client.get_config()
                metadata = config_data.get("metadata", {})

                config_instances = []
                for k, v in metadata.items():
                    val_str = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
                    config_instances.append(Configuration(key=k, value=val_str))

                serialized = ConfigurationSerializer(config_instances, many=True).data
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to get server configuration")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['patch'], url_path='patch')
    def patch_config(self, request):
        """Partially update Incus server configuration key-value pairs."""
        config = request.data
        if not config:
            return Response({"error": "Request body is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with TblincClient() as client:
                result = client.update_config(config)
                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to update server configuration")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['put'], url_path='set')
    def set_config(self, request):
        """Replace the full Incus server configuration."""
        config = request.data
        if not config:
            return Response({"error": "Request body is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with TblincClient() as client:
                result = client.update_config(config)
                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to set server configuration")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
