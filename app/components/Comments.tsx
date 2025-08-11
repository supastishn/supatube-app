import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CommentItem from './CommentItem';
import LoginPrompt from './LoginPrompt';

export type Comment = {
  id: string;
  username: string;
  comment: string;
  created_at: string;
  avatar_url?: string;
  replies?: Comment[];
};

export default function Comments({ videoId }: { videoId: string }) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<TextInput>(null);

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
      const payload = { comment: text, parentCommentId: replyTo?.id };
      await api.post(`/api/videos/${videoId}/comments`, payload);
      setText('');
      setReplyTo(null);
      // optimistic reload
      await load();
    } catch (e: any) {
      Alert.alert('Failed to post comment', e?.message || '');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  if (loading) return <ActivityIndicator style={{ marginVertical: 16 }} />;

  return (
    <View>
      <Text style={styles.header}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} onReply={handleReply} />}
        ListEmptyComponent={<Text style={{ color: '#666' }}>No comments yet.</Text>}
      />
      {replyTo && (
        <View style={styles.replyingToBox}>
          <Text>Replying to {replyTo.username}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={{ color: 'red' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginRight: 8 },
  send: { backgroundColor: '#ff0000', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '600' },
  replyingToBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
