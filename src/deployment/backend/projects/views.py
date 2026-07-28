from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Project
from .serializers import ProjectSerializer
import logging

logger = logging.getLogger(__name__)

class ProjectViewSet(viewsets.ViewSet):
    """
    ViewSet for interacting with projects.
    Supports list, retrieve, create, update, partial_update, and destroy.
    """
    lookup_field = 'name'

    def list(self, request):
        try:
            with TblincClient() as client:
                projects_data = client.list_projects(recursion=1)
                serialized = serialize_data(Project, ProjectSerializer, projects_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list projects")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, name=None):
        try:
            with TblincClient() as client:
                project_data = client.get_project(name)
                serialized = serialize_data(Project, ProjectSerializer, project_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get project {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            with TblincClient() as client:
                result = client.create_project(request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to create project")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.update_project(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update project {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, name=None):
        try:
            with TblincClient() as client:
                result = client.patch_project(name, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch project {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, name=None):
        try:
            with TblincClient() as client:
                client.delete_project(name)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete project {name}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
