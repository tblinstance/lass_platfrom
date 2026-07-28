from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Server
from .serializers import ServerSerializer
from rest_framework.permissions import IsAdminUser
import logging

logger = logging.getLogger(__name__)

class ServerViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    """
    ViewSet for retrieving host server configuration.
    """
    def list(self, request):
        try:
            with TblincClient() as client:
                server_data = client.get_server_info()
                serialized = serialize_data(Server, ServerSerializer, server_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to get server info")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

