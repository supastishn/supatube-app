import { api } from '@/lib/api';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Playlist = { id: string; title: string; visibility: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  videoId: string;
}

export default function SaveToPlaylistModal({ visible, onClose, videoId }: Props) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/playlists/me');
      setPlaylists(data || []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      load();
    }
  }, [visible, load]);

  const addToPlaylist = async (playlistId: string) => {
    setAddingTo((prev) => new Set(prev).add(playlistId));
    try {
      await api.post(`/api/playlists/${playlistId}/videos`, { videoId });
      // Close modal after successfully adding
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingTo((prev) => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
    }
  };

  const createAndClose = () => {
    onClose();
    router.push('/playlists/create');
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Save to...</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ margin: 24 }} />
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => addToPlaylist(item.id)}>
                <Text style={styles.title}>{item.title}</Text>
                {addingTo.has(item.id) ? (
                  <ActivityIndicator />
                ) : (
                  <FontAwesome name="plus" size={16} color="#333" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>You have no playlists.</Text>}
          />
        )}
        <TouchableOpacity style={styles.createButton} onPress={createAndClose}>
          <FontAwesome name="plus" size={16} color="#333" />
          <Text style={styles.createButtonText}>Create new playlist</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerText: { fontSize: 18, fontWeight: 'bold' },
  item: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
  createButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 'auto',
  },
  createButtonText: { fontSize: 16 },
});
