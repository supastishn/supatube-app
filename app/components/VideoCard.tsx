import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export type Video = {
  id: string;
  title: string;
  description?: string;
  channel?: { id: string; name: string; avatarUrl?: string } | null;
  thumbnailUrl?: string;
  views?: number;
};

export default function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/video/${video.id}`} asChild>
      <TouchableOpacity>
        <View style={styles.card}>
          {video.thumbnailUrl ? (
            <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbPlaceholder]} />
          )}
          <View style={styles.metaRow}>
            {video?.channel?.avatarUrl ? (
              <Image source={{ uri: video.channel.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{video.channel?.name || 'Unknown Channel'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  thumbnail: { width: '100%', aspectRatio: 16/9, backgroundColor: '#eee', borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: '#ddd' },
  metaRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666', marginTop: 2 },
});
