import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

type Video = { id: string; title: string; views: number; visibility: string };

export default function StudioScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/videos?userId=${user.id}`);
      setVideos(data || []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user])
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Link href={`/studio/edit/${item.id}`} asChild>
          <TouchableOpacity style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.meta}>
                {item.visibility} • {item.views} views
              </Text>
            </View>
            <FontAwesome name="chevron-right" color="#ccc" size={16} />
          </TouchableOpacity>
        </Link>
      )}
      ListHeaderComponent={() => (
        <View style={styles.header}>
          <Link href="/studio/analytics" asChild>
            <TouchableOpacity style={styles.analyticsButton}>
              <Text style={styles.analyticsButtonText}>View Channel Analytics</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>You have not uploaded any videos.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  analyticsButton: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  analyticsButtonText: { fontWeight: 'bold' },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 16 },
  meta: { color: '#666', marginTop: 4, textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
