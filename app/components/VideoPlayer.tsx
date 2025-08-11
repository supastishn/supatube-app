import React, { useState, useMemo } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';
import { View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoStreamUrl } from '@/lib/api';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/context/AuthContext';

export default function VideoPlayer({ id }: { id: string }) {
  const { token } = useAuth();
  const [showControls, setShowControls] = useState(false);

  const source = useMemo(() => {
    if (!id) return null;
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return {
      uri: videoStreamUrl(id),
      headers,
    };
  }, [id, token]);

  const player = useVideoPlayer(source);

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  };

  const handleSliderChange = (value: number) => {
    if (player.duration) {
      player.seek(value * player.duration);
    }
  };

  const formatTime = (ms?: number | null) => {
    if (ms === undefined || ms === null || isNaN(ms)) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => setShowControls(!showControls)}>
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            nativeControls={false}
            contentFit="contain"
            allowsFullscreen
          />

          {player.loading && (
            <View style={styles.loading}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          {player.error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>Playback failed: {player.error}</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {showControls && !player.loading && !player.error && (
        <View style={styles.controls}>
          <TouchableWithoutFeedback onPress={togglePlayPause}>
            <Ionicons name={player.playing ? 'pause' : 'play'} size={32} color="white" />
          </TouchableWithoutFeedback>

          <Slider
            style={styles.slider}
            value={(player.position || 0) / (player.duration || 1)}
            onValueChange={handleSliderChange}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FF0000"
            maximumTrackTintColor="#FFFFFF4D"
            thumbTintColor="#FF0000"
          />

          <Text style={styles.time}>
            {formatTime(player.position)} / {formatTime(player.duration)}
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
