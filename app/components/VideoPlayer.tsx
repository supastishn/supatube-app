import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as ExpoVideo from 'expo-video';
import { videoStreamUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function VideoPlayer({ id }: { id: string }) {
  const ref = useRef<ExpoVideo.VideoView>(null);
  const { token } = useAuth();
  const source = useMemo<ExpoVideo.VideoSource>(() => {
    const src: ExpoVideo.VideoSource = {
      uri: videoStreamUrl(id),
    };
    if (token) {
      src.headers = {
        Authorization: `Bearer ${token}`,
      };
    }
    return src;
  }, [id, token]);

  return (
    <View style={styles.container}>
      <ExpoVideo.Video
        ref={ref}
        style={styles.video}
        source={source}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
});
