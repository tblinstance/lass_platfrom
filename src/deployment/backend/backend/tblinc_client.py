import os
import httpx
import logging

logger = logging.getLogger(__name__)

class TblincClient:
    """
    Client for interacting with the Incus REST API.
    By default, it uses the local Unix domain socket at /var/lib/incus/unix.socket.
    Can be configured to use a remote TLS connection.
    """
    def __init__(self, project=None):
        self.project = project
        self.socket_path = os.environ.get("tblinc_SOCKET_PATH", "/var/lib/incus/unix.socket")
        self.api_url = os.environ.get("tblinc_API_URL", "http://localhost")
        self.cert_path = os.environ.get("tblinc_CERT_PATH", None)
        self.key_path = os.environ.get("tblinc_KEY_PATH", None)
        self.verify_ssl = os.environ.get("tblinc_VERIFY_SSL", "False") == "True"

        # Initialize the HTTP client
        if self.cert_path and self.key_path and self.api_url and self.api_url.startswith("https://"):
            # TLS Client Certificate Authentication
            cert = (self.cert_path, self.key_path)
            self.client = httpx.Client(cert=cert, verify=self.verify_ssl, base_url=self.api_url)
        else:
            # Local Unix Domain Socket
            if not os.path.exists(self.socket_path):
                logger.warning(f"Incus socket not found at {self.socket_path}. Calls will fail.")
            transport = httpx.HTTPTransport(uds=self.socket_path)
            self.client = httpx.Client(transport=transport, base_url="http://localhost")

    def _request(self, method: str, path: str, **kwargs):
        """Helper to make API requests and extract the metadata or raise errors."""
        url = f"/1.0{path}"
        project = kwargs.pop("project", self.project)
        if project:
            params = kwargs.setdefault("params", {})
            params["project"] = project
        try:
            response = self.client.request(method, url, **kwargs)
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                # If there's an HTTP error, check if we can extract a clean message from the response JSON
                try:
                    data = response.json()
                    if data and data.get("error"):
                        raise httpx.HTTPStatusError(
                            message=data.get("error"),
                            request=response.request,
                            response=response
                        )
                except (ValueError, KeyError, AttributeError):
                    pass
                # Otherwise re-raise the original HTTPStatusError
                raise e

            data = response.json()
            # Handle synchronous/async success operations that might carry structured error metadata
            if data.get("type") == "error":
                raise httpx.HTTPStatusError(
                    message=data.get("error", "Unknown Incus API Error"),
                    request=response.request,
                    response=response
                )
            return data
        except httpx.HTTPError as e:
            logger.error(f"Incus API request failed: {e}")
            raise

    def get_server_info(self):
        """Fetch Incus server configuration and information."""
        return self._request("GET", "")

    # --- Instances ---
    def list_instances(self, recursion: int = 1, all_projects: bool = False):
        """List all instances (containers/VMs) on the Incus host."""
        params = {"recursion": recursion}
        if all_projects:
            params["all-projects"] = "true"
        return self._request("GET", "/instances", params=params)

    def get_instance(self, name: str):
        """Get details of a specific instance."""
        return self._request("GET", f"/instances/{name}")

    def create_instance(self, data: dict):
        """Create a new instance (container or VM)."""
        return self._request("POST", "/instances", json=data)

    def update_instance(self, name: str, data: dict):
        """Replace instance configuration (PUT)."""
        return self._request("PUT", f"/instances/{name}", json=data)

    def patch_instance(self, name: str, data: dict):
        """Partially update instance configuration (PATCH)."""
        return self._request("PATCH", f"/instances/{name}", json=data)

    def delete_instance(self, name: str):
        """Delete an instance."""
        return self._request("DELETE", f"/instances/{name}")

    def get_instance_state(self, name: str):
        """Get current operational state of a specific instance."""
        return self._request("GET", f"/instances/{name}/state")

    def control_instance_state(self, name: str, action: str, timeout: int = 30, force: bool = False):
        """
        Control the state of an instance.
        Actions can be: start, stop, restart, freeze, unfreeze.
        """
        payload = {
            "action": action,
            "timeout": timeout,
            "force": force
        }
        return self._request("PUT", f"/instances/{name}/state", json=payload)

    # --- Images ---
    def list_images(self, recursion: int = 1):
        """List all images on the Incus host."""
        params = {"recursion": recursion}
        return self._request("GET", "/images", params=params)

    def get_image(self, fingerprint: str):
        """Get details of a specific image."""
        return self._request("GET", f"/images/{fingerprint}")

    def update_image(self, fingerprint: str, data: dict):
        """Replace image properties (PUT)."""
        return self._request("PUT", f"/images/{fingerprint}", json=data)

    def patch_image(self, fingerprint: str, data: dict):
        """Partially update image properties (PATCH)."""
        return self._request("PATCH", f"/images/{fingerprint}", json=data)

    def delete_image(self, fingerprint: str):
        """Delete an image."""
        return self._request("DELETE", f"/images/{fingerprint}")

    def pull_image(self, data: dict):
        """Pull an image from a remote server (simplestreams)."""
        return self._request("POST", "/images", json=data)

    # --- Networks ---
    def list_networks(self, recursion: int = 1, all_projects: bool = False):
        """List all networks configured on the Incus host."""
        params = {"recursion": recursion}
        if all_projects:
            params["all-projects"] = "true"
        return self._request("GET", "/networks", params=params)

    def get_network(self, name: str):
        """Get details of a specific network."""
        return self._request("GET", f"/networks/{name}")

    def create_network(self, data: dict):
        """Create a new network."""
        return self._request("POST", "/networks", json=data)

    def update_network(self, name: str, data: dict):
        """Replace network configuration (PUT)."""
        return self._request("PUT", f"/networks/{name}", json=data)

    def patch_network(self, name: str, data: dict):
        """Partially update network configuration (PATCH)."""
        return self._request("PATCH", f"/networks/{name}", json=data)

    def delete_network(self, name: str):
        """Delete a network."""
        return self._request("DELETE", f"/networks/{name}")

    # --- Storage Pools ---
    def list_storage_pools(self, recursion: int = 1):
        """List all storage pools configured on the Incus host."""
        params = {"recursion": recursion}
        return self._request("GET", "/storage-pools", params=params)

    def get_storage_pool(self, name: str):
        """Get details of a specific storage pool."""
        return self._request("GET", f"/storage-pools/{name}")

    def create_storage_pool(self, data: dict):
        """Create a new storage pool."""
        return self._request("POST", "/storage-pools", json=data)

    def update_storage_pool(self, name: str, data: dict):
        """Replace storage pool configuration (PUT)."""
        return self._request("PUT", f"/storage-pools/{name}", json=data)

    def patch_storage_pool(self, name: str, data: dict):
        """Partially update storage pool configuration (PATCH)."""
        return self._request("PATCH", f"/storage-pools/{name}", json=data)

    def delete_storage_pool(self, name: str):
        """Delete a storage pool."""
        return self._request("DELETE", f"/storage-pools/{name}")

    # --- Operations ---
    def list_operations(self, recursion: int = 1):
        """List all background operations currently running."""
        params = {"recursion": recursion}
        return self._request("GET", "/operations", params=params)

    def get_operation(self, uuid: str):
        """Get details of a specific background operation."""
        return self._request("GET", f"/operations/{uuid}")

    def cancel_operation(self, uuid: str):
        """Cancel (delete) a background operation."""
        return self._request("DELETE", f"/operations/{uuid}")

    # --- Profiles ---
    def list_profiles(self, recursion: int = 1):
        """List all profiles configured on the Incus host."""
        params = {"recursion": recursion}
        return self._request("GET", "/profiles", params=params)

    def get_profile(self, name: str):
        """Get details of a specific profile."""
        return self._request("GET", f"/profiles/{name}")

    def create_profile(self, data: dict):
        """Create a new profile."""
        return self._request("POST", "/profiles", json=data)

    def update_profile(self, name: str, data: dict):
        """Replace profile configuration (PUT)."""
        return self._request("PUT", f"/profiles/{name}", json=data)

    def patch_profile(self, name: str, data: dict):
        """Partially update profile configuration (PATCH)."""
        return self._request("PATCH", f"/profiles/{name}", json=data)

    def delete_profile(self, name: str):
        """Delete a profile."""
        return self._request("DELETE", f"/profiles/{name}")

    # --- Projects ---
    def list_projects(self, recursion: int = 1):
        """List all projects configured on the Incus host."""
        params = {"recursion": recursion}
        return self._request("GET", "/projects", params=params)

    def get_project(self, name: str):
        """Get details of a specific project."""
        return self._request("GET", f"/projects/{name}")

    def create_project(self, data: dict):
        """Create a new project."""
        return self._request("POST", "/projects", json=data)

    def update_project(self, name: str, data: dict):
        """Replace project configuration (PUT)."""
        return self._request("PUT", f"/projects/{name}", json=data)

    def patch_project(self, name: str, data: dict):
        """Partially update project configuration (PATCH)."""
        return self._request("PATCH", f"/projects/{name}", json=data)

    def delete_project(self, name: str):
        """Delete a project."""
        return self._request("DELETE", f"/projects/{name}")

    # --- Resources (sys_os / usage) — read-only ---
    def get_resources(self):
        """Get hardware resources available on the Incus host."""
        return self._request("GET", "/resources")

    # --- Warnings ---
    def list_warnings(self, recursion: int = 1):
        """List all warnings on the Incus host."""
        params = {"recursion": recursion}
        return self._request("GET", "/warnings", params=params)

    def get_warning(self, uuid: str):
        """Get details of a specific warning."""
        return self._request("GET", f"/warnings/{uuid}")

    def patch_warning(self, uuid: str, data: dict):
        """Partially update a warning (e.g. acknowledge it) (PATCH)."""
        return self._request("PATCH", f"/warnings/{uuid}", json=data)

    def delete_warning(self, uuid: str):
        """Delete (dismiss) a warning."""
        return self._request("DELETE", f"/warnings/{uuid}")

    # --- Metrics (usage) — read-only ---
    def get_metrics(self):
        """Get OpenMetrics-compatible metrics from the Incus host."""
        return self._request("GET", "/metrics")

    # --- Configuration ---
    def get_config(self):
        """Get the current server configuration."""
        return self._request("GET", "")

    def update_config(self, config: dict):
        """Update server configuration (PATCH)."""
        return self._request("PATCH", "", json=config)

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
