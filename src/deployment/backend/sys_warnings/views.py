from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import SysWarning
from .serializers import SysWarningSerializer
from rest_framework.permissions import IsAdminUser
import logging

logger = logging.getLogger(__name__)

class SysWarningsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    """
    ViewSet for listing and retrieving system warnings from the Incus host.
    Supports list, retrieve, partial_update (acknowledge), and destroy (dismiss).
    """
    lookup_field = 'uuid'

    def list(self, request):
        try:
            with TblincClient() as client:
                warnings_data = client.list_warnings(recursion=1)
                serialized = serialize_data(SysWarning, SysWarningSerializer, warnings_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list warnings")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, uuid=None):
        try:
            with TblincClient() as client:
                warning_data = client.get_warning(uuid)
                serialized = serialize_data(SysWarning, SysWarningSerializer, warning_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get warning {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, uuid=None):
        try:
            with TblincClient() as client:
                result = client.patch_warning(uuid, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch warning {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, uuid=None):
        try:
            with TblincClient() as client:
                client.delete_warning(uuid)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete warning {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
