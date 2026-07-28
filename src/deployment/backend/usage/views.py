from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Usage
from .serializers import UsageSerializer
import logging

logger = logging.getLogger(__name__)

class UsageViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving resource usage and metrics from the Incus host.
    """
    def list(self, request):
        try:
            with TblincClient() as client:
                resources = client.get_resources()
                serialized = serialize_data(Usage, UsageSerializer, resources.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to get usage/resources")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

