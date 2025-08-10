import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native';
import VideoCard, { Video } from '@/components/VideoCard';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function HistoryScreen() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/history');
      setVideos(data?.videos ?? data ?? []);
    } catch (e: any) {
      Alert.alert('Failed to load history', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    else setLoading(false);
  }, [token]);

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
        keyExtractor={(item: any) => `${item.id}-${item.watched_at}`}
        renderItem={({ item }) => <VideoCard video={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 24 }}>
            Your watch history is empty.
          </Text>
        }
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
