import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';

export default function UploadScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [thumbnail, setThumbnail] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const pickThumbnail = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) setThumbnail(result.assets[0]);
  };

  const submit = async () => {
    if (!title.trim() || !video)
      return Alert.alert('Error', 'Title and a video file are required.');
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('visibility', visibility);
    formData.append('video', {
      uri: video.uri,
      name: video.name,
      type: video.mimeType,
    } as any);
    if (thumbnail) {
      formData.append('thumbnail', {
        uri: thumbnail.uri,
        name: thumbnail.name,
        type: thumbnail.mimeType,
      } as any);
    }

    try {
      await api.postForm('/api/videos', formData);
      Alert.alert('Success', 'Video uploaded! It will be processed shortly.');
      router.back();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Video Title" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Video Description"
        multiline
      />

      <TouchableOpacity style={styles.pickerButton} onPress={pickVideo}>
        <Text>{video ? `Video: ${video.name}` : 'Select Video File'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.pickerButton} onPress={pickThumbnail}>
        <Text>{thumbnail ? `Thumbnail: ${thumbnail.name}` : 'Select Thumbnail (Optional)'}</Text>
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Upload</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  textArea: { height: 120, textAlignVertical: 'top' },
  pickerButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
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
  submitButton: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#ff0000',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
});
