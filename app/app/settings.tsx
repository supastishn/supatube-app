import { api } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';

type Settings = {
  record_watch_history: boolean;
  default_upload_visibility: 'public' | 'unlisted' | 'private';
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/settings');
      setSettings(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateSetting = async (key: keyof Settings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setSaving(true);
    try {
      await api.patch('/api/settings', { [key]: value });
    } catch (e: any) {
      Alert.alert('Error saving', e.message);
      // revert
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      {saving && <ActivityIndicator style={styles.savingIndicator} />}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Record watch history</Text>
        <Switch
          value={settings.record_watch_history}
          onValueChange={(val) => updateSetting('record_watch_history', val)}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Default upload visibility</Text>
      </View>
      <View style={styles.visContainer}>
        <TouchableOpacity
          onPress={() => updateSetting('default_upload_visibility', 'public')}
          style={[
            styles.visOption,
            settings.default_upload_visibility === 'public' && styles.visOptionActive,
          ]}>
          <Text>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateSetting('default_upload_visibility', 'unlisted')}
          style={[
            styles.visOption,
            settings.default_upload_visibility === 'unlisted' && styles.visOptionActive,
          ]}>
          <Text>Unlisted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateSetting('default_upload_visibility', 'private')}
          style={[
            styles.visOption,
            settings.default_upload_visibility === 'private' && styles.visOptionActive,
          ]}>
          <Text>Private</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  settingLabel: { fontSize: 16 },
  savingIndicator: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  visContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  visOption: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#eee' },
  visOptionActive: { backgroundColor: '#ccc' },
});
