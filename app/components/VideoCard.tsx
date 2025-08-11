import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export type Video = {
  id: string;
  title: string;
  description?: string;
  channel?: { id: string; name: string; avatarUrl?: string } | null;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  views?: number;
  created_at?: string;
};

function formatViews(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M views';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K views';
  return num + ' views';
}

export function timeSince(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
}

export default function VideoCard({ video }: { video: Video }) {
  const thumb = video.thumbnailUrl || video.thumbnail_url;
  return (
    <Link href={`/video/${video.id}`} asChild>
      <TouchableOpacity>
        <View style={styles.card}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumbnail} />
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
              <Text style={styles.title} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {video.channel?.name || 'Unknown Channel'}
                {video.views !== undefined && ` • ${formatViews(video.views)}`}
                {` • ${timeSince(video.created_at)}`}
              </Text>
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
  subtitle: { color: '#666', marginTop: 2, fontSize: 12 },
});
