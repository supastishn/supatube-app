import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

function getDefaultBaseUrl() {
  const env = (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  // heuristics for emulator vs device
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const BASE_URL = getDefaultBaseUrl();

async function getAuthHeader() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request(path: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(await getAuthHeader()),
  };
  const res = await fetch(BASE_URL + path, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p: string) => request(p),
  post: (p: string, body?: any) => request(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (p: string, body?: any) => request(p, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: (p: string, body?: any) => request(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: (p: string) => request(p, { method: 'DELETE' }),
};

export function videoStreamUrl(id: string) {
  return `${BASE_URL}/api/videos/${id}/stream`;
}
