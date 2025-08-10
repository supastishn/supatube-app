import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

export default function CreatePlaylistScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    setLoading(true);
    try {
      await api.post('/api/playlists', { title, description, visibility });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="My Awesome Playlist"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="(Optional)"
        multiline
      />

      <Text style={styles.label}>Visibility</Text>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          onPress={() => setVisibility('public')}
          style={[styles.switchOption, visibility === 'public' && styles.switchOptionActive]}>
          <Text>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisibility('unlisted')}
          style={[styles.switchOption, visibility === 'unlisted' && styles.switchOptionActive]}>
          <Text>Unlisted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisibility('private')}
          style={[styles.switchOption, visibility === 'private' && styles.switchOptionActive]}>
          <Text>Private</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  switchOption: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#eee' },
  switchOptionActive: { backgroundColor: '#ccc' },
  button: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
