from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import SysOs
from .serializers import SysOsSerializer
import logging

logger = logging.getLogger(__name__)

class SysOsViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving hardware and OS resource information from the Incus host.
    """
    def list(self, request):
        try:
            with TblincClient() as client:
                resources_data = client.get_resources()
                serialized = serialize_data(SysOs, SysOsSerializer, resources_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to get OS/hardware resources")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

