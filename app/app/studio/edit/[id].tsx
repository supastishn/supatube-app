import { api } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

export default function EditVideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/videos/${id}`)
      .then(setVideo)
      .catch((e) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const saveChanges = async () => {
    if (!video) return;
    setSaving(true);
    try {
      await api.patch(`/api/videos/${id}`, {
        title: video.title,
        description: video.description,
        visibility: video.visibility,
      });
      Alert.alert('Success', 'Video updated');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = () => {
    Alert.alert('Delete Video', 'Are you sure you want to permanently delete this video?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await api.delete(`/api/videos/${id}`);
            Alert.alert('Success', 'Video deleted');
            router.replace('/studio');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (!video) return <Text>Video not found.</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={video.title}
        onChangeText={(t) => setVideo((v: any) => ({ ...v, title: t }))}
      />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
        value={video.description}
        onChangeText={(t) => setVideo((v: any) => ({ ...v, description: t }))}
        multiline
      />
      <Text style={styles.label}>Visibility</Text>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          onPress={() => setVideo((v: any) => ({ ...v, visibility: 'public' }))}
          style={[
            styles.switchOption,
            video.visibility === 'public' && styles.switchOptionActive,
          ]}>
          <Text>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVideo((v: any) => ({ ...v, visibility: 'unlisted' }))}
          style={[
            styles.switchOption,
            video.visibility === 'unlisted' && styles.switchOptionActive,
          ]}>
          <Text>Unlisted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVideo((v: any) => ({ ...v, visibility: 'private' }))}
          style={[
            styles.switchOption,
            video.visibility === 'private' && styles.switchOptionActive,
          ]}>
          <Text>Private</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={saveChanges} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={deleteVideo} disabled={saving}>
        <Text style={styles.deleteButtonText}>Delete Video</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  switchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
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
  deleteButton: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: { color: 'red', fontWeight: 'bold' },
});
