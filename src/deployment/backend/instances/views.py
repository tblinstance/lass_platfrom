from rest_framework import viewsets
from rest_framework.decorators import action as drf_action
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Instance
from .serializers import InstanceSerializer
import logging

logger = logging.getLogger(__name__)

class InstanceViewSet(viewsets.ViewSet):
    """
    ViewSet for interacting with instances.
    Supports list, retrieve, create, update, partial_update, destroy, state, and action.
    """
    lookup_field = 'name'

    def get_project_name(self, request):
        if request.user.is_authenticated and not request.user.is_staff and not request.user.is_superuser:
            return f"member-{request.user.username}".lower().replace('_', '-').replace('.', '-')
        
        project = request.query_params.get("project", None)
        if not project and (request.user.is_staff or request.user.is_superuser):
            name = self.kwargs.get("name", None)
            if name:
                try:
                    with TblincClient(project=None) as client:
                        res = client.list_instances(recursion=1, all_projects=True)
                        metadata = res.get("metadata", [])
                        for inst in metadata:
                            if inst.get("name") == name:
                                return inst.get("project")
                except Exception:
                    logger.exception(f"Failed to auto-detect project for instance {name}")
        return project

    def list(self, request):
        try:
            project_name = self.get_project_name(request)
            all_projects = False
            if (request.user.is_staff or request.user.is_superuser) and not request.query_params.get("project"):
                all_projects = True
            with TblincClient(project=project_name) as client:
                instances_data = client.list_instances(recursion=1, all_projects=all_projects)
                serialized = serialize_data(Instance, InstanceSerializer, instances_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list instances")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                instance_data = client.get_instance(name)
                serialized = serialize_data(Instance, InstanceSerializer, instance_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get instance {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.create_instance(request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to create instance")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.update_instance(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update instance {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.patch_instance(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch instance {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                client.delete_instance(name)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete instance {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @drf_action(detail=True, methods=['get'])
    def state(self, request, name=None):
        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                state_data = client.get_instance_state(name)
                return Response(state_data.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get instance {name} state")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @drf_action(detail=True, methods=['post'])
    def action(self, request, name=None):
        action_name = request.data.get("action")
        if not action_name:
            return Response({"error": "Action parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        valid_actions = ["start", "stop", "restart", "freeze", "unfreeze"]
        if action_name not in valid_actions:
            return Response(
                {"error": f"Invalid action. Must be one of {valid_actions}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        timeout = request.data.get("timeout", 30)
        force = request.data.get("force", False)

        try:
            with TblincClient(project=self.get_project_name(request)) as client:
                result = client.control_instance_state(name, action_name, timeout, force)
                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to perform action {action_name} on {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @drf_action(detail=True, methods=['post'], url_path='exec')
    def execute_command(self, request, name=None):
        command = request.data.get("command")
        if not command:
            return Response({"error": "Command parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        import subprocess
        try:
            project_name = self.get_project_name(request)
            cmd = ["incus", "exec", name]
            if project_name:
                cmd.extend(["--project", project_name])
            cmd.extend(["--", "/bin/sh", "-c", command])
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15.0)
            
            return Response({
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }, status=status.HTTP_200_OK)
        except subprocess.TimeoutExpired:
            return Response({"error": "Command execution timed out after 15 seconds"}, status=status.HTTP_408_REQUEST_TIMEOUT)
        except Exception as e:
            logger.exception(f"Failed to execute command on {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
