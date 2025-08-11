import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from './LoginPrompt';

export type Comment = {
  id: string;
  username: string;
  comment: string;
  created_at: string;
};

export default function Comments({ videoId }: { videoId:string }) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/videos/${videoId}/comments`);
      setComments(data?.comments ?? data ?? []);
    } catch (e: any) {
      Alert.alert('Failed to load comments', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [videoId]);

  const post = async () => {
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }
    if (!text.trim()) return;
    setPosting(true);
    try {
      const created = await api.post(`/api/videos/${videoId}/comments`, { comment: text });
      setText('');
      // optimistic reload
      await load();
    } catch (e: any) {
      Alert.alert('Failed to post comment', e?.message || '');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginVertical: 16 }} />;

  return (
    <View>
      <Text style={styles.header}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.author}>{item.username || 'User'}</Text>
            <Text>{item.comment}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>No comments yet.</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Add a comment"
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity style={styles.send} onPress={post} disabled={posting}>
          {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Post</Text>}
        </TouchableOpacity>
      </View>
      <LoginPrompt visible={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  comment: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  author: { fontWeight: '600', marginBottom: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginRight: 8 },
  send: { backgroundColor: '#ff0000', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '600' },
});
