from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Operation
from .serializers import OperationSerializer
import logging

logger = logging.getLogger(__name__)

class OperationViewSet(viewsets.ViewSet):
    """
    ViewSet for interacting with background operations.
    Supports list, retrieve, and destroy (cancel).
    """
    lookup_field = 'uuid'

    def list(self, request):
        try:
            with TblincClient() as client:
                operations_data = client.list_operations(recursion=1)
                serialized = serialize_data(Operation, OperationSerializer, operations_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list operations")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, uuid=None):
        try:
            with TblincClient() as client:
                operation_data = client.get_operation(uuid)
                serialized = serialize_data(Operation, OperationSerializer, operation_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get operation {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, uuid=None):
        try:
            with TblincClient() as client:
                client.cancel_operation(uuid)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to cancel operation {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
