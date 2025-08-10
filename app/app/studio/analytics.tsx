import { api } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/analytics/channel/me')
      .then(setStats)
      .catch((e) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (!stats) return <Text>Could not load stats.</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Channel Analytics</Text>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totals?.views ?? 0}</Text>
        <Text style={styles.statLabel}>Total Views</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{(stats.totals?.watch_seconds / 3600).toFixed(1)}</Text>
        <Text style={styles.statLabel}>Watch Time (hours)</Text>
      </View>
      <Text style={styles.header}>Top Videos</Text>
      {stats.topVideos?.map((video: any) => (
        <View key={video.id} style={styles.videoRow}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {video.title}
          </Text>
          <Text style={styles.videoViews}>{video.views} views</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  statCard: {
    backgroundColor: '#eee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: '#666' },
  videoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  videoTitle: { flex: 1 },
  videoViews: { color: '#666' },
});
