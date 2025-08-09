import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Redirect href="/(auth)/login" />;
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="video/[id]" options={{ title: 'Video' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
