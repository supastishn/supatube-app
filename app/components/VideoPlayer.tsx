import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { videoStreamUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function VideoPlayer({ id }: { id: string }) {
  const ref = useRef<Video>(null);
  const { token } = useAuth();
  const source = useMemo(() => ({
    uri: videoStreamUrl(id),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }), [id, token]);

  return (
    <View style={styles.container}>
      <Video
        ref={ref}
        style={styles.video}
        source={source as any}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
});
