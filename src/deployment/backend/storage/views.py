from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import StoragePool
from .serializers import StoragePoolSerializer
from rest_framework.permissions import IsAdminUser
import logging

logger = logging.getLogger(__name__)

class StoragePoolViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    """
    ViewSet for interacting with storage pools.
    Supports list, retrieve, create, update, partial_update, and destroy.
    """
    lookup_field = 'name'

    def list(self, request):
        try:
            with TblincClient() as client:
                pools_data = client.list_storage_pools(recursion=1)
                serialized = serialize_data(StoragePool, StoragePoolSerializer, pools_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list storage pools")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, name=None):
        try:
            with TblincClient() as client:
                pool_data = client.get_storage_pool(name)
                serialized = serialize_data(StoragePool, StoragePoolSerializer, pool_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get storage pool {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            with TblincClient() as client:
                result = client.create_storage_pool(request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to create storage pool")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.update_storage_pool(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update storage pool {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.patch_storage_pool(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch storage pool {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, name=None):
        try:
            with TblincClient() as client:
                client.delete_storage_pool(name)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete storage pool {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
