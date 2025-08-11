import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import VideoCard, { Video } from '@/components/VideoCard';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'expo-router';

export default function SubscriptionsScreen() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!token) {
      setLoading(false);
      setVideos([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get('/api/subscriptions/feed/me');
      setVideos(data?.videos ?? data ?? []);
    } catch (e: any) {
      Alert.alert('Failed to load feed', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!token) {
    return (
      <View style={styles.loggedOutContainer}>
        <Text style={styles.loggedOutText}>Log in to see your subscriptions.</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 24 }}>
            No new videos from your subscriptions.
          </Text>
        }
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loggedOutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loggedOutText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  loginButton: { backgroundColor: '#ff0000', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
});
