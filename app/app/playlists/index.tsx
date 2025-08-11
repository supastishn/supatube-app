import { api } from '@/lib/api';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

type Playlist = { id: string; title: string; video_count: number; visibility: string };

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/playlists/me');
      setPlaylists(data || []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [params.refresh])
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      <Link href="/playlists/create" asChild>
        <TouchableOpacity style={styles.createButton}>
          <FontAwesome name="plus" size={16} color="#fff" />
          <Text style={styles.createButtonText}>Create new playlist</Text>
        </TouchableOpacity>
      </Link>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/playlists/${item.id}`} asChild>
            <TouchableOpacity style={styles.item}>
              <View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.count}>
                  {item.visibility} • {item.video_count} videos
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#ccc" />
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={<Text style={styles.empty}>You have no playlists.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  createButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: { color: '#fff', fontWeight: 'bold' },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  count: { color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
