import { api, getFullImageUrl } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';

type Settings = {
  record_watch_history: boolean;
  default_upload_visibility: 'public' | 'unlisted' | 'private';
};

export default function SettingsScreen() {
  const { user, refetchUser } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

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
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const pickAvatar = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (name !== user.name) {
        await api.patch('/api/users/me', { name });
      }
      if (avatar) {
        const formData = new FormData();
        if (Platform.OS === 'web' && avatar.file) {
          formData.append('avatar', avatar.file);
        } else {
          formData.append('avatar', {
            uri: avatar.uri,
            name: avatar.name,
            type: avatar.mimeType,
          } as any);
        }
        await api.postForm('/api/users/me/avatar', formData);
        setAvatar(null);
      }
      await refetchUser();
      Alert.alert('Success', 'Profile updated');
    } catch (e: any) {
      Alert.alert('Error saving profile', e.message);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading || !settings || !user) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      {saving && <ActivityIndicator style={styles.savingIndicator} />}

      <Text style={styles.header}>Profile Settings</Text>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: getFullImageUrl(avatar?.uri || user.avatar_url) }}
          style={styles.avatar}
          key={avatar?.uri || user.avatar_url}
        />
        <TouchableOpacity style={styles.pickerButton} onPress={pickAvatar}>
          <Text>{avatar ? `Image: ${avatar.name}` : 'Change Picture'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Display Name"
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>

      <Text style={styles.header}>General Settings</Text>
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
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickerButton: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
