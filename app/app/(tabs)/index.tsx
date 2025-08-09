import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native';
import VideoCard, { Video } from '@/components/VideoCard';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { loading: authLoading, token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/videos');
      setVideos(data?.videos ?? data ?? []);
    } catch (e: any) {
      Alert.alert('Failed to load videos', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 24 }}>No videos</Text>}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
