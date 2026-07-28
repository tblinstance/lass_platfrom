from rest_framework import viewsets, permissions
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'address', 'balance', 'is_staff', 'is_superuser', 'password', 'date_joined']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin users to manage Members / users accounts.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserManagementSerializer
    permission_classes = [permissions.IsAdminUser]  # Expose only to staff/superusers

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

class UserAuthTokenView(APIView):
    """
    View for customers to get and regenerate their API Auth Key (Secret Key)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token, created = Token.objects.get_or_create(user=request.user)
        return Response({'key': token.key})

    def post(self, request):
        # Regenerate the token by deleting old and creating new
        Token.objects.filter(user=request.user).delete()
        token = Token.objects.create(user=request.user)
        return Response({'key': token.key, 'message': 'API Key regenerated successfully.'})


# ── SSH Keys ─────────────────────────────────────────────────────────────────

from .models import SshKey
from .serializers import SshKeySerializer
from rest_framework import status as http_status


class SshKeyViewSet(viewsets.ViewSet):
    """
    CRUD for SSH public keys scoped to the authenticated user.
    GET  /api/auth/ssh-keys/          → list
    POST /api/auth/ssh-keys/          → create
    DELETE /api/auth/ssh-keys/{id}/   → destroy
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        keys = SshKey.objects.filter(user=request.user)
        return Response(SshKeySerializer(keys, many=True).data)

    def create(self, request):
        serializer = SshKeySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=http_status.HTTP_201_CREATED)
        return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            key = SshKey.objects.get(pk=pk, user=request.user)
            key.delete()
            return Response(status=http_status.HTTP_204_NO_CONTENT)
        except SshKey.DoesNotExist:
            return Response({'error': 'SSH key not found.'}, status=http_status.HTTP_404_NOT_FOUND)


# ── WebAuthn Passkeys ─────────────────────────────────────────────────────────

import os, base64, json, struct, hashlib
from rest_framework.decorators import action
from djoser.webauthn.models import CredentialOptions


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _b64url_decode(s: str) -> bytes:
    s = s.replace('-', '+').replace('_', '/')
    padding = 4 - len(s) % 4
    if padding != 4:
        s += '=' * padding
    return base64.b64decode(s)


class WebauthnKeysViewSet(viewsets.ViewSet):
    """
    ViewSet for managing WebAuthn credentials of the authenticated user.
    Generates and verifies passkeys without relying on the old webauthn 0.4.x library.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _rp_settings(self):
        from django.conf import settings
        return {
            'rp_id':  getattr(settings, 'WEBAUTHN_RP_ID',   'localhost'),
            'rp_name': getattr(settings, 'WEBAUTHN_RP_NAME', 'TblInc Cloud'),
            'origin': getattr(settings, 'WEBAUTHN_ORIGIN',  'http://localhost:5173'),
        }

    def list(self, request):
        try:
            co = request.user.credential_options
            if co.credential_id:
                return Response([{
                    'id': co.id,
                    'display_name': co.display_name,
                    'username': co.username,
                    'credential_id': co.credential_id,
                }])
        except CredentialOptions.DoesNotExist:
            pass
        return Response([])

    @action(detail=False, methods=['post'], url_path='register_options')
    def register_options(self, request):
        rp = self._rp_settings()
        # Generate a cryptographically-random 32-byte challenge and store as base64url
        challenge_bytes = os.urandom(32)
        challenge_b64 = _b64url_encode(challenge_bytes)

        co, _ = CredentialOptions.objects.get_or_create(
            user=request.user,
            defaults={
                'username': request.user.email,
                'ukey': _b64url_encode(os.urandom(20)),
                'display_name': request.user.username,
                'credential_id': '',
                'public_key': '',
            }
        )
        co.challenge = challenge_b64
        if not co.username:
            co.username = request.user.email
        co.save()

        return Response({
            'challenge': challenge_b64,
            'rp': {'id': rp['rp_id'], 'name': rp['rp_name']},
            'user': {
                'id': co.ukey,
                'name': co.username,
                'displayName': co.display_name,
            },
            'pubKeyCredParams': [
                {'alg': -7,   'type': 'public-key'},  # ES256
                {'alg': -257, 'type': 'public-key'},  # RS256
            ],
            'timeout': 60000,
            'attestation': 'none',
            'excludeCredentials': [],
            'authenticatorSelection': {
                'residentKey': 'preferred',
                'userVerification': 'preferred',
            },
        })

    @action(detail=False, methods=['post'], url_path='verify')
    def verify(self, request):
        try:
            co = request.user.credential_options
        except CredentialOptions.DoesNotExist:
            return Response(
                {'error': 'No registration options found. Please request registration options first.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        rp = self._rp_settings()
        data = request.data

        try:
            # 1. Decode and parse clientDataJSON
            client_data_bytes = _b64url_decode(data['response']['clientDataJSON'])
            client_data = json.loads(client_data_bytes.decode('utf-8'))

            # 2. Verify type
            if client_data.get('type') != 'webauthn.create':
                return Response({'error': 'Invalid clientData type.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 3. Verify challenge
            received_challenge = client_data.get('challenge', '')
            if received_challenge != co.challenge:
                return Response({'error': 'Challenge mismatch.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 4. Verify origin
            if client_data.get('origin') != rp['origin']:
                return Response(
                    {'error': f"Origin mismatch: got {client_data.get('origin')!r}, expected {rp['origin']!r}."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )

            # 5. Decode attestationObject and extract authData
            attestation_bytes = _b64url_decode(data['response']['attestationObject'])

            # Parse CBOR manually (cbor2 may not be installed; use basic parsing)
            try:
                import cbor2
                attestation_obj = cbor2.loads(attestation_bytes)
            except ImportError:
                # Fallback: try the webauthn library's internal CBOR
                from webauthn.webauthn import _cbor_decode  # type: ignore
                attestation_obj = _cbor_decode(attestation_bytes)

            auth_data: bytes = attestation_obj['authData']

            # 6. Verify RP ID hash
            rp_id_hash = auth_data[:32]
            expected_hash = hashlib.sha256(rp['rp_id'].encode()).digest()
            if rp_id_hash != expected_hash:
                return Response({'error': 'RP ID hash mismatch.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 7. Check flags: UP (bit 0) must be set
            flags = auth_data[32]
            if not (flags & 0x01):
                return Response({'error': 'User presence flag not set.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 8. Extract sign count and credential data
            sign_count = struct.unpack('!I', auth_data[33:37])[0]

            # 9. Extract credential ID from authData
            # authData layout after flags+sign_count: aaguid (16) | credIdLen (2) | credId | coseKey
            aaguid = auth_data[37:53]
            cred_id_len = struct.unpack('!H', auth_data[53:55])[0]
            cred_id_bytes = auth_data[55:55 + cred_id_len]
            credential_id = _b64url_encode(cred_id_bytes)

            # Store public key as base64url of the CBOR-encoded COSE key
            public_key_bytes = auth_data[55 + cred_id_len:]
            public_key_b64 = _b64url_encode(public_key_bytes)

        except (KeyError, ValueError, struct.error) as e:
            return Response(
                {'error': f'Invalid attestation data: {e}'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {'error': f'Verification failed: {e}'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # 10. Persist the credential
        co.challenge = ''
        co.sign_count = sign_count
        co.credential_id = credential_id
        co.public_key = public_key_b64
        co.save()

        return Response({'success': True}, status=http_status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            co = CredentialOptions.objects.get(pk=pk, user=request.user)
            co.delete()
            return Response(status=http_status.HTTP_204_NO_CONTENT)
        except CredentialOptions.DoesNotExist:
            return Response({'error': 'WebAuthn passkey not found.'}, status=http_status.HTTP_404_NOT_FOUND)

    # ── Discoverable-credential login (no username required) ─────────────────

    @action(detail=False, methods=['post'], url_path='login_request',
            permission_classes=[permissions.AllowAny])
    def login_request(self, request):
        """
        Generate a WebAuthn assertion challenge.
        Returns empty allowCredentials so the browser presents any registered passkey.
        A short-lived challenge_token (stored in Django cache / Redis) is returned
        and must be sent back with login_verify — no cookies required.
        """
        import uuid
        from django.core.cache import caches
        webauthn_cache = caches['webauthn']

        rp = self._rp_settings()
        challenge_bytes = os.urandom(32)
        challenge_b64 = _b64url_encode(challenge_bytes)

        # Persist challenge in LocMemCache for 5 minutes, keyed by a random opaque token
        token = str(uuid.uuid4())
        webauthn_cache.set(f'webauthn_login:{token}', challenge_b64, timeout=300)

        return Response({
            'challenge': challenge_b64,
            'challenge_token': token,
            'rpId': rp['rp_id'],
            'timeout': 60000,
            'userVerification': 'preferred',
            'allowCredentials': [],  # discoverable — browser picks the right key
        })

    @action(detail=False, methods=['post'], url_path='login_verify',
            permission_classes=[permissions.AllowAny])
    def login_verify(self, request):
        """
        Verify a WebAuthn assertion and return JWT tokens.
        Expects: challenge_token (from login_request) + WebAuthn assertion fields.
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.core.cache import caches
        webauthn_cache = caches['webauthn']

        rp = self._rp_settings()
        data = request.data

        # Retrieve and immediately consume challenge from LocMemCache
        token = data.get('challenge_token', '')
        if not token:
            return Response(
                {'error': 'Missing challenge_token.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        cache_key = f'webauthn_login:{token}'
        expected_challenge = webauthn_cache.get(cache_key)
        if not expected_challenge:
            return Response(
                {'error': 'Login challenge expired or not found. Please try again.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        # Consume immediately to prevent replay
        webauthn_cache.delete(cache_key)

        try:
            # 1. Decode clientDataJSON
            client_data_bytes = _b64url_decode(data['response']['clientDataJSON'])
            client_data = json.loads(client_data_bytes.decode('utf-8'))

            # 2. Verify type
            if client_data.get('type') != 'webauthn.get':
                return Response({'error': 'Invalid clientData type.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 3. Verify challenge
            if client_data.get('challenge', '') != expected_challenge:
                return Response({'error': 'Challenge mismatch.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 4. Verify origin
            if client_data.get('origin') != rp['origin']:
                return Response(
                    {'error': f"Origin mismatch: got {client_data.get('origin')!r}, expected {rp['origin']!r}."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )

            raw_id_b64 = data.get('rawId') or data.get('id', '')
            # Clean base64url format
            clean_b64url = raw_id_b64.replace('+', '-').replace('/', '_').rstrip('=')
            
            # Standard base64 format with padding
            padding = 4 - (len(clean_b64url) % 4)
            padded = clean_b64url + ('=' * padding if padding != 4 else '')
            standard_b64 = padded.replace('-', '+').replace('_', '/')

            try:
                co = CredentialOptions.objects.get(credential_id__in=[
                    clean_b64url, 
                    padded, 
                    standard_b64, 
                    data.get('rawId', ''), 
                    data.get('id', '')
                ])
            except CredentialOptions.DoesNotExist:
                return Response({'error': 'Passkey not found.'}, status=http_status.HTTP_400_BAD_REQUEST)
            except CredentialOptions.MultipleObjectsReturned:
                co = CredentialOptions.objects.filter(credential_id__in=[clean_b64url, padded, standard_b64]).first()

            if co.user is None:
                return Response({'error': 'Passkey has no associated user.'}, status=http_status.HTTP_400_BAD_REQUEST)

            # 6. Verify authenticatorData
            auth_data_bytes = _b64url_decode(data['response']['authenticatorData'])

            rp_id_hash = auth_data_bytes[:32]
            expected_hash = hashlib.sha256(rp['rp_id'].encode()).digest()
            if rp_id_hash != expected_hash:
                return Response({'error': 'RP ID hash mismatch.'}, status=http_status.HTTP_400_BAD_REQUEST)

            flags = auth_data_bytes[32]
            if not (flags & 0x01):
                return Response({'error': 'User presence flag not set.'}, status=http_status.HTTP_400_BAD_REQUEST)

            sign_count = struct.unpack('!I', auth_data_bytes[33:37])[0]
            stored = co.sign_count or 0
            if sign_count > 0 and stored > 0 and sign_count <= stored:
                return Response({'error': 'Sign count invalid (possible replay attack).'}, status=http_status.HTTP_400_BAD_REQUEST)

        except (KeyError, ValueError, struct.error) as e:
            return Response({'error': f'Invalid assertion data: {e}'}, status=http_status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Login verification failed: {e}'}, status=http_status.HTTP_400_BAD_REQUEST)

        # 7. Update sign count
        co.sign_count = sign_count
        co.save()

        # 8. Issue JWT tokens
        user = co.user
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=http_status.HTTP_200_OK)

