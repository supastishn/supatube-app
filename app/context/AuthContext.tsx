import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

import { api } from '@/lib/api';

export type AuthState = {
  token: string | null;
  user: any | null;
  loading: boolean;
};

export type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, loading: true });

  // hydrate token
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        setState((s) => ({ ...s, token: token ?? null, loading: false }));
      } catch (e) {
        setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/api/users/login', { email, password });
      const token = res.token ?? res.data?.token ?? res?.accessToken ?? res?.jwt;
      if (!token) throw new Error('No token returned');
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      setState({ token, user: res.user ?? res.data?.user ?? null, loading: false });
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Please try again');
      throw e;
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await api.post('/api/users/register', { name, email, password });
      const token = res.token ?? res.data?.token ?? res?.accessToken ?? res?.jwt;
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        setState({ token, user: res.user ?? res.data?.user ?? { name, email }, loading: false });
      } else {
        // if backend does not auto-login, then call login
        await signIn(email, password);
      }
    } catch (e: any) {
      Alert.alert('Registration failed', e?.message || 'Please try again');
      throw e;
    }
  }, [signIn]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setState({ token: null, user: null, loading: false });
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signUp, signOut }), [state, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
