from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from backend.tblinc_client import TblincClient
from transactions.models import Transaction
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class AdminDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving system-wide administrative dashboard statistics.
    """
    def list(self, request):
        if not request.user.is_authenticated or (not request.user.is_staff and not request.user.is_superuser):
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            stats = {}
            
            # 1. Users statistics
            stats["users"] = {
                "total": User.objects.count(),
                "admins": User.objects.filter(is_staff=True).count() + User.objects.filter(is_superuser=True).distinct().count(),
                "members": User.objects.filter(is_staff=False, is_superuser=False).count(),
            }
            
            # 2. Query Incus server resources and lists
            with TblincClient() as client:
                try:
                    instances_data = client.list_instances(recursion=1)
                    instances = instances_data.get("metadata", [])
                    stats["instances"] = {
                        "total": len(instances),
                        "running": sum(1 for inst in instances if inst.get("status") == "Running"),
                        "stopped": sum(1 for inst in instances if inst.get("status") != "Running"),
                    }
                except Exception as e:
                    logger.warning(f"Failed to fetch instances: {e}")
                    stats["instances"] = {"total": 0, "running": 0, "stopped": 0, "error": str(e)}

                try:
                    projects_data = client.list_projects(recursion=1)
                    stats["projects_count"] = len(projects_data.get("metadata", []))
                except Exception as e:
                    logger.warning(f"Failed to fetch projects: {e}")
                    stats["projects_count"] = 0

                try:
                    images_data = client.list_images(recursion=1)
                    stats["images_count"] = len(images_data.get("metadata", []))
                except Exception as e:
                    logger.warning(f"Failed to fetch images: {e}")
                    stats["images_count"] = 0

                try:
                    storage_pools_data = client.list_storage_pools(recursion=1)
                    stats["storage_pools_count"] = len(storage_pools_data.get("metadata", []))
                except Exception as e:
                    logger.warning(f"Failed to fetch storage pools: {e}")
                    stats["storage_pools_count"] = 0

                try:
                    networks_data = client.list_networks(recursion=1)
                    stats["networks_count"] = len(networks_data.get("metadata", []))
                except Exception as e:
                    logger.warning(f"Failed to fetch networks: {e}")
                    stats["networks_count"] = 0

                try:
                    warnings_data = client.list_warnings(recursion=1)
                    warnings = warnings_data.get("metadata", [])
                    stats["warnings"] = {
                        "total": len(warnings),
                        "active": sum(1 for w in warnings if w.get("status") == "active"),
                        "acknowledged": sum(1 for w in warnings if w.get("status") == "acknowledged"),
                    }
                except Exception as e:
                    logger.warning(f"Failed to fetch warnings: {e}")
                    stats["warnings"] = {"total": 0, "active": 0, "acknowledged": 0, "error": str(e)}

                try:
                    operations_data = client.list_operations(recursion=1)
                    stats["operations_count"] = len(operations_data.get("metadata", []))
                except Exception as e:
                    logger.warning(f"Failed to fetch operations: {e}")
                    stats["operations_count"] = 0

                try:
                    resources_data = client.get_resources()
                    stats["resources"] = resources_data.get("metadata", {})
                except Exception as e:
                    logger.warning(f"Failed to fetch resource usage: {e}")
                    stats["resources"] = {"error": str(e)}

            # 3. Transactions count in DB
            stats["transactions"] = {
                "total": Transaction.objects.count(),
                "success": Transaction.objects.filter(status="success").count(),
                "failed": Transaction.objects.filter(status="failed").count(),
            }
            
            return Response(stats, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception("Failed to build admin dashboard stats")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
