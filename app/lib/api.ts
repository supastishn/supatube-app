import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getValueFor } from './storage';

const TOKEN_KEY = 'auth_token';

function getDefaultBaseUrl() {
  const env = (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;

  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special IP for the Android emulator to connect to the host machine's localhost.
    // If you are running the app on a physical Android device, you need to replace this
    // with your computer's IP address on the local network.
    // You can also set the EXPO_PUBLIC_API_URL environment variable to override this.
    return 'http://10.0.2.2:3001';
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, localhost works directly. For physical iOS devices, same as Android,
    // you'll need to use your computer's local network IP.
    return 'http://127.0.0.1:3001';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // pick up whatever host the web app is served from, but hit port 3001
    const { protocol, hostname } = window.location;
    const resolvedHostname = hostname === 'localhost' ? '127.0.0.1' : hostname;
    return `${protocol}//${resolvedHostname}:3001`;
  }

  // fallback for iOS simulator
  return 'http://127.0.0.1:3001';
}

export const BASE_URL = getDefaultBaseUrl();

async function getAuthHeader() {
  try {
    const token = await getValueFor(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function multipartRequest(path: string, formData: FormData) {
  const headers: HeadersInit = {
    // 'Content-Type': 'multipart/form-data' is set automatically by fetch with FormData
    ...(await getAuthHeader()),
  };

  try {
    const res = await fetch(BASE_URL + path, {
      method: 'POST',
      headers,
      body: formData,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      console.error(`Request failed with status ${res.status}:`, data);
      const msg = data?.message || data?.error || res.statusText;
      const err: any = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (error) {
    console.error(`Request error to ${path}:`, error);
    throw error;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(await getAuthHeader()),
  };

  try {
    const res = await fetch(BASE_URL + path, {
      ...options,
      headers,
    });
    const text = await res.text();
    let data: any = null;
    try { 
      data = text ? JSON.parse(text) : null;
    } catch { 
      data = text;
    }
    if (!res.ok) {
      console.error(`Request failed with status ${res.status}:`, data);
      const msg = data?.message || data?.error || res.statusText;
      const err: any = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (error) {
    console.error(`Request error to ${path}:`, error);
    throw error;
  }
}

export const api = {
  get: (p: string) => request(p),
  post: (p: string, body?: any) => request(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  postForm: (p: string, formData: FormData) => multipartRequest(p, formData),
  put: (p: string, body?: any) => request(p, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: (p: string, body?: any) => request(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: (p: string) => request(p, { method: 'DELETE' }),
};

export function getFullImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('file:') || path.startsWith('data:')) {
    return path;
  }
  return BASE_URL + path;
}

export function videoStreamUrl(id: string) {
  return `${BASE_URL}/api/videos/${id}/stream`;
}

export function videoStreamUrlByFilename(filename: string) {
  return `${BASE_URL}/api/videos/${filename}`;
}
