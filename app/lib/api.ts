import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getValueFor } from './storage';

const TOKEN_KEY = 'auth_token';

function getDefaultBaseUrl() {
  // Hardcoded production backend URL
  return 'https://supatube.supastishn.hackclub.com';
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
