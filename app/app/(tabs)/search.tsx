import React, { useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, ActivityIndicator, Alert } from 'react-native';
import VideoCard, { Video } from '@/components/VideoCard';
import { api } from '@/lib/api';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/search?q=${encodeURIComponent(q.trim())}`);
      setResults(data?.results ?? data?.videos ?? data ?? []);
    } catch (e: any) {
      Alert.alert('Search failed', e?.message || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search videos"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 24 }}>No results</Text>}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { margin: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
});
