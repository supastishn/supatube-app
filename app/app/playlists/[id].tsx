import { api } from '@/lib/api';
import VideoCard, { Video } from '@/components/VideoCard';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';

type Playlist = { id: string; title: string; description: string; videos: Video[] };

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/playlists/${id}`);
      setPlaylist(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (!playlist)
    return <Text style={{ textAlign: 'center', marginTop: 24 }}>Playlist not found.</Text>;

  return (
    <FlatList
      data={playlist.videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <VideoCard video={item} />}
      ListHeaderComponent={() => (
        <View style={styles.header}>
          <Text style={styles.title}>{playlist.title}</Text>
          {playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>This playlist is empty.</Text>}
      contentContainerStyle={{ paddingBottom: 12 }}
    />
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold' },
  description: { color: '#666', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
