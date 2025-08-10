import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

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
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{
              title: 'Register',
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </>
      )}
      <Stack.Screen name="video/[id]" options={{ title: 'Video', headerShown: false }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Video', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="history" options={{ title: 'Watch History' }} />
      <Stack.Screen name="studio/index" options={{ title: 'Creator Studio' }} />
      <Stack.Screen name="studio/analytics" options={{ title: 'Channel Analytics' }} />
      <Stack.Screen name="studio/edit/[id]" options={{ title: 'Edit Video' }} />
      <Stack.Screen name="playlists/index" options={{ title: 'My Playlists' }} />
      <Stack.Screen
        name="playlists/create"
        options={{ title: 'New Playlist', presentation: 'modal' }}
      />
      <Stack.Screen name="playlists/[id]" options={{ title: 'Playlist' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.eruda) return;
      const script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/eruda';
      document.body.appendChild(script);
      script.onload = () => {
        // @ts-ignore
        eruda.init();
      };
    }
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
