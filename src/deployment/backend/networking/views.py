from rest_framework import viewsets, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Network, DnsRule
from .serializers import NetworkSerializer, DnsRuleSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

class NetworkViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    """
    ViewSet for interacting with networks.
    Supports list, retrieve, create, update, partial_update, and destroy.
    """
    lookup_field = 'name'

    def get_project_name(self, request):
        if request.user.is_authenticated and not request.user.is_staff and not request.user.is_superuser:
            return f"member-{request.user.username}".lower().replace('_', '-').replace('.', '-')
        return request.query_params.get("project", None)

    def list(self, request):
        try:
            project_name = self.get_project_name(request)
            all_projects = False
            if (request.user.is_staff or request.user.is_superuser) and not request.query_params.get("project"):
                all_projects = True
            with TblincClient(project=project_name) as client:
                networks_data = client.list_networks(recursion=1, all_projects=all_projects)
                serialized = serialize_data(Network, NetworkSerializer, networks_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list networks")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                network_data = client.get_network(name)
                serialized = serialize_data(Network, NetworkSerializer, network_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get network {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            project_name = self.get_project_name(request)
            data = request.data.copy()
            # Force OVN type and uplink for any network inside a member project namespace
            if project_name and project_name.startswith("member-"):
                data["type"] = "ovn"
                data["config"] = {
                    "network": "ovn-uplink"
                }
            with TblincClient(project=project_name) as client:
                result = client.create_network(data)
                return Response(result.get("metadata", {}), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to create network")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.update_network(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update network {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.patch_network(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch network {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, name=None):
        try:
            project_name = self.get_project_name(request)
            with TblincClient(project=project_name) as client:
                # 1. Query and clean up all instances in the project namespace
                try:
                    instances_res = client.list_instances(recursion=1)
                    instances = instances_res.get("metadata", [])
                    for inst in instances:
                        inst_name = inst.get("name")
                        inst_status = inst.get("status")
                        if inst_status == "Running":
                            try:
                                client.control_instance_state(inst_name, "stop", force=True)
                            except Exception:
                                pass
                        try:
                            client.delete_instance(inst_name)
                        except Exception:
                            pass
                except Exception:
                    logger.exception("Failed to query or clean up instances before network deletion")

                # 2. Query and detach network interfaces from profiles in this project
                try:
                    profile_res = client.get_profile("default")
                    profile = profile_res.get("metadata", {})
                    devices = profile.get("devices", {})
                    modified = False
                    for dev_name, dev_config in list(devices.items()):
                        if dev_config.get("type") == "nic" and dev_config.get("network") == name:
                            del devices[dev_name]
                            modified = True
                    if modified:
                        client.patch_profile("default", {"devices": devices})
                except Exception:
                    logger.exception("Failed to clean up default profile devices before network deletion")

                # 3. Finally, delete the network namespace
                client.delete_network(name)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete network {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def leases(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                response = client.client.get(f"/1.0/networks/{name}/leases")
                # Handle empty/missing leases
                if response.status_code == 404:
                    return Response([], status=status.HTTP_200_OK)
                response.raise_for_status()
                return Response(response.json().get("metadata", []), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get leases for network {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DnsRuleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DnsRuleSerializer
    queryset = DnsRule.objects.all()

    def get_project_name(self, request):
        if request.user.is_authenticated and not request.user.is_staff and not request.user.is_superuser:
            return f"member-{request.user.username}".lower().replace('_', '-').replace('.', '-')
        return request.query_params.get("project", None)

    def get_queryset(self):
        project = self.get_project_name(self.request)
        if project:
            return DnsRule.objects.filter(project=project)
        # If staff and no project query param, return all
        if self.request.user.is_staff or self.request.user.is_superuser:
            return DnsRule.objects.all()
        return DnsRule.objects.none()

    def perform_create(self, serializer):
        project = self.get_project_name(self.request)
        if not project:
            raise serializers.ValidationError({"project": "Project namespace could not be determined."})
        serializer.save(project=project)

