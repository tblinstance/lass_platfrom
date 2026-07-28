from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from .models import Setting
from .serializers import SettingSerializer
import logging
import json

logger = logging.getLogger(__name__)

class SettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for viewing and updating Incus server settings (config key-value pairs).
    """
    def list(self, request):
        try:
            with TblincClient() as client:
                server_data = client.get_config()
                config = server_data.get("metadata", {}).get("config", {})
                
                setting_instances = []
                for k, v in config.items():
                    val_str = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
                    setting_instances.append(Setting(key=k, value=val_str))
                
                serialized = SettingSerializer(setting_instances, many=True).data
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to get server settings")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

