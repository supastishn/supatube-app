import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import Comments from '@/components/Comments';
import { useAuth } from '@/context/AuthContext';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vid = Array.isArray(id) ? id[0] : id;
  const { token } = useAuth();

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState<boolean>(false);

  const load = async () => {
    if (!vid) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/videos/${vid}`);
      setVideo(data?.video ?? data ?? null);
      setLiked(Boolean((data?.video ?? data)?.liked));
    } catch (e: any) {
      Alert.alert('Failed to load video', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [vid]);

  const like = async () => {
    if (!token) return Alert.alert('Login required', 'Please sign in to like videos.');
    setLiking(true);
    try {
      await api.post(`/api/videos/${vid}/like`, {});
      setLiked(true);
    } catch (e: any) {
      Alert.alert('Failed to like', e?.message || '');
    } finally {
      setLiking(false);
    }
  };

  if (loading || !vid) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (!video) return <Text style={{ margin: 16 }}>Video not found</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <VideoPlayer id={vid} />
      <Text style={styles.title}>{video.title}</Text>
      <Text style={styles.channel}>{video.channel?.name || 'Unknown Channel'}</Text>
      <Text style={styles.desc}>{video.description}</Text>
      <TouchableOpacity style={[styles.likeBtn, liked && styles.likeBtnActive]} onPress={like} disabled={liking || liked}>
        <Text style={[styles.likeText, liked && styles.likeTextActive]}>{liked ? 'Liked' : 'Like'}</Text>
      </TouchableOpacity>
      <Comments videoId={vid} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 8, paddingHorizontal: 12 },
  channel: { color: '#666', marginTop: 4, paddingHorizontal: 12 },
  desc: { marginTop: 8, paddingHorizontal: 12 },
  likeBtn: { margin: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  likeBtnActive: { backgroundColor: '#ff0000' },
  likeText: { fontWeight: '700', color: '#ff0000' },
  likeTextActive: { color: '#fff' },
});
