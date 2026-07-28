from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Image
from .serializers import ImageSerializer
import logging

logger = logging.getLogger(__name__)

class ImageViewSet(viewsets.ViewSet):
    """
    ViewSet for interacting with images.
    Supports list, retrieve, update, partial_update, and destroy.
    (Images can be pulled from community indexes or uploaded.)
    """
    lookup_field = 'fingerprint'

    def create(self, request):
        # 1. Check for file upload (multipart upload)
        if 'file' in request.FILES:
            uploaded_file = request.FILES['file']
            filename = uploaded_file.name
            public = request.data.get("public") == "true"
            try:
                with TblincClient() as client:
                    def file_chunk_generator():
                        for chunk in uploaded_file.chunks():
                            yield chunk

                    headers = {
                        "Content-Type": "application/octet-stream",
                        "X-Incus-Filename": filename,
                        "X-Incus-Public": "true" if public else "false"
                    }
                    response = client.client.post("/1.0/images", content=file_chunk_generator(), headers=headers, timeout=600.0)
                    response.raise_for_status()
                    return Response(response.json(), status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.exception("Failed to upload image file")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. JSON pull modes
        mode = request.data.get("mode", "simplestreams")
        
        if mode == "simplestreams":
            alias = request.data.get("alias")
            image_type = request.data.get("type", "container")
            if not alias:
                return Response({"error": "Alias parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                with TblincClient() as client:
                    payload = {
                        "source": {
                            "type": "image",
                            "mode": "pull",
                            "server": "https://images.linuxcontainers.org",
                            "protocol": "simplestreams",
                            "alias": alias
                        },
                        "type": image_type
                    }
                    result = client.pull_image(payload)
                    return Response(result, status=status.HTTP_202_ACCEPTED)
            except Exception as e:
                logger.exception(f"Failed to pull simplestreams image {alias}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif mode == "oci":
            alias = request.data.get("alias")
            server = request.data.get("server", "https://registry-1.docker.io")
            if not alias:
                return Response({"error": "Alias parameter (Docker image tag) is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                with TblincClient() as client:
                    payload = {
                        "source": {
                            "type": "image",
                            "mode": "pull",
                            "server": server,
                            "protocol": "docker",
                            "alias": alias
                        }
                    }
                    result = client.pull_image(payload)
                    return Response(result, status=status.HTTP_202_ACCEPTED)
            except Exception as e:
                logger.exception(f"Failed to pull OCI image {alias}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif mode == "iso":
            url = request.data.get("url")
            public = request.data.get("public") == "true"
            if not url:
                return Response({"error": "URL parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                import httpx
                filename = url.split('/')[-1] or "custom.iso"
                if not filename.endswith(".iso") and not filename.endswith(".img"):
                    filename += ".iso"

                with TblincClient() as client:
                    with httpx.stream("GET", url, follow_redirects=True, timeout=600.0) as r:
                        r.raise_for_status()
                        
                        def chunk_generator():
                            for chunk in r.iter_bytes(chunk_size=65536):
                                yield chunk

                        headers = {
                            "Content-Type": "application/octet-stream",
                            "X-Incus-Filename": filename,
                            "X-Incus-Public": "true" if public else "false"
                        }
                        
                        response = client.client.post("/1.0/images", content=chunk_generator(), headers=headers, timeout=600.0)
                        response.raise_for_status()
                        return Response(response.json(), status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.exception(f"Failed to pull ISO from {url}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"error": f"Invalid mode: {mode}"}, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['get'], url_path='remote')
    def remote_images(self, request):
        import subprocess
        import json
        try:
            # Fetch remote images in JSON format using incus CLI
            output = subprocess.check_output(["incus", "image", "list", "images:", "--format", "json"])
            data = json.loads(output)
            
            # Group unique templates by fingerprint + type to avoid showing duplicate rows for alternative aliases
            templates_by_fingerprint = {}
            for item in data:
                if not item.get("aliases") or item.get("architecture") != "x86_64":
                    continue
                
                fingerprint = item.get("fingerprint")
                image_type = item.get("type", "container")
                key = (fingerprint, image_type)
                
                # Fetch clean alias list
                aliases = [a.get("name") for a in item.get("aliases", []) if a.get("name")]
                
                if not aliases:
                    continue
                
                # Sort aliases by length to choose the shortest/cleanest representation as primary
                aliases.sort(key=len)
                primary_alias = aliases[0]
                
                if key not in templates_by_fingerprint:
                    templates_by_fingerprint[key] = {
                        "alias": primary_alias,
                        "aliases": aliases,
                        "fingerprint": fingerprint[:12],
                        "type": image_type,
                        "sizeMB": round(item.get("size", 0) / (1024 * 1024)),
                        "description": item.get("properties", {}).get("description", ""),
                        "os": item.get("properties", {}).get("os", "Unknown"),
                        "release": item.get("properties", {}).get("release", "")
                    }
                else:
                    # Merge any additional alias lists
                    existing = templates_by_fingerprint[key]
                    for a in aliases:
                        if a not in existing["aliases"]:
                            existing["aliases"].append(a)
                    existing["aliases"].sort(key=len)
                    existing["alias"] = existing["aliases"][0]
            
            # Sort final unique list by OS/release/type/alias
            filtered = list(templates_by_fingerprint.values())
            filtered.sort(key=lambda x: (x["os"], x["release"], x["type"], x["alias"]))
            return Response(filtered, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to fetch remote images list")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request):
        try:
            with TblincClient() as client:
                images_data = client.list_images(recursion=1)
                serialized = serialize_data(Image, ImageSerializer, images_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list images")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, fingerprint=None):
        try:
            with TblincClient() as client:
                image_data = client.get_image(fingerprint)
                serialized = serialize_data(Image, ImageSerializer, image_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get image {fingerprint}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, fingerprint=None):
        try:
            with TblincClient() as client:
                result = client.update_image(fingerprint, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to update image {fingerprint}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, fingerprint=None):
        try:
            with TblincClient() as client:
                result = client.patch_image(fingerprint, request.data)
                return Response(result.get("metadata", {}), status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to patch image {fingerprint}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, fingerprint=None):
        try:
            with TblincClient() as client:
                client.delete_image(fingerprint)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to delete image {fingerprint}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
