import React, { useState, useRef, useEffect } from 'react';
import { Video, AVPlaybackSource } from 'expo-av';
import { View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoStreamUrl } from '@/lib/api';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/context/AuthContext';

export default function VideoPlayer({ id }: { id: string }) {
  const { token } = useAuth();
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<AVPlaybackSource | null>(null);

  useEffect(() => {
    if (!id) return;

    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    setSource({
      uri: videoStreamUrl(id),
      headers,
    });
  }, [id, token]);

  const togglePlayPause = () => {
    if (status?.isPlaying) {
      video.current?.pauseAsync();
    } else {
      video.current?.playAsync();
    }
    setShowControls(true);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoad = (payload: any) => {
    setLoading(false);
    if (payload.isLoaded) {
      setStatus(payload);
    }
  };

  const handleError = (errorMsg: string) => {
    setLoading(false);
    setError(`Playback failed: ${errorMsg || 'The video could not be loaded.'}`);
  };

  const handleSliderChange = (value: number) => {
    video.current?.setPositionAsync(value * (status?.durationMillis || 0));
  };

  const formatTime = (ms?: number) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => setShowControls(!showControls)}>
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.video}
            source={source}
            useNativeControls={false}
            resizeMode="contain"
            isLooping={false}
            onPlaybackStatusUpdate={setStatus as any}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
          />

          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          {error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {showControls && !loading && !error && (
        <View style={styles.controls}>
          <TouchableWithoutFeedback onPress={togglePlayPause}>
            <Ionicons 
              name={status?.isPlaying ? 'pause' : 'play'} 
              size={32} 
              color="white" 
            />
          </TouchableWithoutFeedback>

          <Slider
            style={styles.slider}
            value={(status?.positionMillis || 0) / (status?.durationMillis || 1)}
            onValueChange={handleSliderChange}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FF0000"
            maximumTrackTintColor="#FFFFFF4D"
            thumbTintColor="#FF0000"
          />

          <Text style={styles.time}>
            {formatTime(status?.positionMillis)} / {formatTime(status?.durationMillis)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  video: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  time: {
    color: 'white',
    fontSize: 12,
    minWidth: 70,
    textAlign: 'right',
  },
});
