import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { token, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && token) {
      router.replace('/');
    }
  }, [token, loading, router]);
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
    </Stack>
  );
}
