import { api } from '@/lib/api';
import Comments from '@/components/Comments';
import SaveToPlaylistModal from '@/components/SaveToPlaylistModal';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vid = Array.isArray(id) ? id[0] : id;
  const { token } = useAuth();

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const load = async () => {
    if (!vid) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/videos/${vid}`);
      setVideo(data);
      const recs = await api.get(`/api/videos/${vid}/recommendations`);
      setRecommendations(recs || []);
    } catch (e: any) {
      Alert.alert('Failed to load video', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [vid]);

  const toggleLike = async () => {
    if (!token) return Alert.alert('Login required', 'Please sign in to like videos.');
    setLiking(true);
    try {
      await api.post(`/api/videos/${vid}/like`);
      // Optimistic update
      setVideo((v: any) => ({
        ...v,
        user_has_liked: !v.user_has_liked,
        likes_count: v.user_has_liked ? v.likes_count - 1 : v.likes_count + 1,
      }));
    } catch (e: any) {
      Alert.alert('Failed to like', e?.message || '');
    } finally {
      setLiking(false);
    }
  };

  const toggleSubscription = async () => {
    if (!token || !video?.user_id) return Alert.alert('Login required');
    setSubscribing(true);
    try {
      await api.post(`/api/subscriptions/${video.user_id}/toggle`);
      setVideo((v: any) => ({ ...v, user_has_subscribed: !v.user_has_subscribed }));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubscribing(false);
    }
  };

  const openPlaylistSaver = () => {
    if (!token) return Alert.alert('Login required', 'Please sign in to save videos.');
    setShowPlaylistModal(true);
  };

  if (loading || !vid) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (!video) return <Text style={{ margin: 16 }}>Video not found</Text>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <VideoPlayer id={vid} />

        <View style={styles.metaContainer}>
          <Text style={styles.title}>{video.title}</Text>
          <View style={styles.channelRow}>
            {video.channel?.avatar_url ? (
              <Image source={{ uri: video.channel.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
            <Text style={styles.channel}>{video.channel?.name || 'Unknown Channel'}</Text>
            <TouchableOpacity
              style={[styles.subBtn, video.user_has_subscribed && styles.subBtnActive]}
              onPress={toggleSubscription}
              disabled={subscribing}>
              <Text style={[styles.subText, video.user_has_subscribed && styles.subTextActive]}>
                {video.user_has_subscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, video.user_has_liked && styles.likeBtnActive]}
              onPress={toggleLike}
              disabled={liking}>
              <FontAwesome
                name={video.user_has_liked ? 'thumbs-up' : 'thumbs-o-up'}
                size={20}
                color={video.user_has_liked ? '#fff' : '#333'}
              />
              <Text style={[styles.actionText, video.user_has_liked && styles.likeTextActive]}>
                {video.likes_count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={openPlaylistSaver}>
              <FontAwesome name="plus-square-o" size={20} color="#333" />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.descBox}>
            <Text style={styles.desc}>{video.description}</Text>
          </View>
        </View>
        <Comments videoId={vid} />
        <View style={styles.recSection}>
          <Text style={styles.recHeader}>Up next</Text>
          {recommendations.map((v: any) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </View>
      </ScrollView>
      <SaveToPlaylistModal
        visible={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={vid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  metaContainer: { padding: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  channelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd' },
  channel: { flex: 1, fontWeight: '600' },
  subBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#000' },
  subBtnActive: { backgroundColor: '#eee' },
  subText: { color: '#fff', fontWeight: 'bold' },
  subTextActive: { color: '#333' },
  actionsRow: { flexDirection: 'row', marginTop: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  likeBtnActive: { backgroundColor: '#333' },
  actionText: { fontWeight: '600' },
  likeTextActive: { color: '#fff' },
  descBox: { backgroundColor: '#eee', padding: 12, borderRadius: 8, marginTop: 16 },
  desc: {},
  recSection: { padding: 12, borderTopWidth: 8, borderColor: '#eee' },
  recHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
});
