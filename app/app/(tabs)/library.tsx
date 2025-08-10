import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LibraryScreen() {
  const { token } = useAuth();

  if (!token) {
    return (
      <View style={styles.loggedOutContainer}>
        <Text style={styles.loggedOutText}>Log in to see your library.</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Link href="/history" asChild>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="history" size={22} color="#333" />
          <Text style={styles.menuText}>History</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/playlists/index" asChild>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="list" size={22} color="#333" />
          <Text style={styles.menuText}>Playlists</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 16,
  },
  menuText: { fontSize: 16 },
  loggedOutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  loggedOutText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  loginButton: { backgroundColor: '#ff0000', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
});
