import { useState, useEffect } from 'react';
import api from '../api/axios';

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  address?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('access_token')
  );

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get<User>('/api/auth/users/me/');
      setUser(res.data);
      setIsAuthenticated(true);
      return res.data;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);
    if (isAuthenticated) {
      fetchUser();
    } else {
      setLoading(false);
    }
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [isAuthenticated]);

  // ── Email / Password ─────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/jwt/create/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      setIsAuthenticated(true);
      const fetchedUser = await fetchUser();
      return { success: true, user: fetchedUser };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid email or password',
      };
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────

  const loginWithGoogle = async (accessToken: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google/', { access_token: accessToken });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      setIsAuthenticated(true);
      const fetchedUser = await fetchUser();
      return { success: true, user: fetchedUser };
    } catch (error: any) {
      const detail =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Google sign-in failed.';
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  // ── GitHub OAuth ─────────────────────────────────────────────────────────

  const loginWithGithub = async () => {
    try {
      const redirectUri = window.location.origin + '/';
      const res = await api.get(`/api/auth/o/github/?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      console.error('Failed to initiate GitHub login:', err);
    }
  };

  const completeGithubLogin = async (state: string, code: string) => {
    setLoading(true);
    try {
      // Djoser's /auth/o/{provider}/ expects form-encoded state + code
      const body = new URLSearchParams({ state, code });
      const res = await api.post(
        '/api/auth/o/github/',
        body,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      setIsAuthenticated(true);
      const fetchedUser = await fetchUser();
      return { success: true, user: fetchedUser };
    } catch (error: any) {
      const detail =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'GitHub sign-in failed.';
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  // ── WebAuthn / Passkey ───────────────────────────────────────────────────

  /** base64url string → ArrayBuffer */
  const b64ToBuffer = (b64: string): ArrayBuffer => {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
  };

  /** ArrayBuffer → base64url string */
  const bufferToB64 = (buf: ArrayBuffer): string =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const registerPasskey = async (username: string) => {
    try {
      // Step 1: Request registration challenge from server
      const challengeRes = await api.post('/api/auth/signup_request/', { username });
      const { ukey, ...options } = challengeRes.data;

      // Step 2: Build PublicKeyCredentialCreationOptions
      const publicKey: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: b64ToBuffer(options.challenge),
        user: { ...options.user, id: b64ToBuffer(options.user.id) },
        excludeCredentials: (options.excludeCredentials ?? []).map((c: any) => ({
          ...c,
          id: b64ToBuffer(c.id),
        })),
      };

      // Step 3: Prompt user's authenticator
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
      const response = credential.response as AuthenticatorAttestationResponse;

      // Step 4: Send attestation to server to complete registration
      await api.post(`/api/auth/signup/${ukey}/`, {
        id: credential.id,
        rawId: bufferToB64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToB64(response.clientDataJSON),
          attestationObject: bufferToB64(response.attestationObject),
        },
      });
      return { success: true };
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        return { success: false, error: 'Passkey registration was cancelled.' };
      }
      const detail = error.response?.data?.detail || error.message || 'Passkey registration failed.';
      return { success: false, error: detail };
    }
  };

  const loginWithPasskey = async () => {
    try {
      // Step 1: Request an assertion challenge (discoverable — no username needed)
      const challengeRes = await api.post('/api/auth/webauthn-keys/login_request/');
      const options = challengeRes.data;
      const challengeToken: string = options.challenge_token;

      // Step 2: Build PublicKeyCredentialRequestOptions
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: b64ToBuffer(options.challenge),
        rpId: options.rpId,
        timeout: options.timeout ?? 60000,
        userVerification: options.userVerification ?? 'preferred',
        allowCredentials: [],  // discoverable — browser picks the right key
      };

      // Step 3: Prompt user's authenticator
      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
      const response = assertion.response as AuthenticatorAssertionResponse;

      // Step 4: Send assertion + challenge_token to our custom verify endpoint
      const res = await api.post('/api/auth/webauthn-keys/login_verify/', {
        challenge_token: challengeToken,
        id: assertion.id,
        rawId: bufferToB64(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToB64(response.clientDataJSON),
          authenticatorData: bufferToB64(response.authenticatorData),
          signature: bufferToB64(response.signature),
          userHandle: response.userHandle ? bufferToB64(response.userHandle) : null,
        },
      });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      setIsAuthenticated(true);
      const fetchedUser = await fetchUser();
      return { success: true, user: fetchedUser };
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        return { success: false, error: 'Passkey sign-in was cancelled.' };
      }
      const detail = error.response?.data?.error || error.response?.data?.detail || error.message || 'Passkey sign-in failed.';
      return { success: false, error: detail };
    }
  };


  const addPasskey = async () => {
    try {
      // Step 1: Request registration challenge for existing user
      const challengeRes = await api.post('/api/auth/webauthn-keys/register_options/');
      const options = challengeRes.data;

      // Step 2: Build PublicKeyCredentialCreationOptions
      const publicKey: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: b64ToBuffer(options.challenge),
        user: { ...options.user, id: b64ToBuffer(options.user.id) },
        excludeCredentials: (options.excludeCredentials ?? []).map((c: any) => ({
          ...c,
          id: b64ToBuffer(c.id),
        })),
      };

      // Step 3: Prompt user's authenticator
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
      const response = credential.response as AuthenticatorAttestationResponse;

      // Step 4: Send attestation to server to complete registration
      await api.post('/api/auth/webauthn-keys/verify/', {
        id: credential.id,
        rawId: bufferToB64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToB64(response.clientDataJSON),
          attestationObject: bufferToB64(response.attestationObject),
        },
      });
      return { success: true };
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        return { success: false, error: 'Passkey registration was cancelled.' };
      }
      const detail = error.response?.data?.detail || error.response?.data?.error || error.message || 'Passkey registration failed.';
      return { success: false, error: detail };
    }
  };

  // ── Registration ─────────────────────────────────────────────────────────

  const register = async (username: string, email: string, password: string, address?: string, is_staff?: boolean) => {
    setLoading(true);
    try {
      await api.post('/api/auth/users/', {
        username,
        email,
        password,
        re_password: password,
        address: address || '',
        is_staff: is_staff || false,
        is_superuser: is_staff || false,
      });
      return { success: true };
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      if (errorData) {
        if (typeof errorData === 'object') {
          errorMessage = Object.values(errorData).flat().join(', ');
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    loginWithGoogle,
    loginWithGithub,
    completeGithubLogin,
    loginWithPasskey,
    registerPasskey,
    addPasskey,
    register,
    logout,
    refreshUser: fetchUser,
  };
}
