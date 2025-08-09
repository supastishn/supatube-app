import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Stack } from 'expo-router';

function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {!token && (
        <>
          <Stack.Screen 
            name="(auth)/login" 
            options={{ 
              title: 'Login', 
              presentation: 'modal',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(auth)/register" 
            options={{ 
              title: 'Register', 
              presentation: 'modal',
              headerShown: false 
            }} 
          />
        </>
      )}
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
