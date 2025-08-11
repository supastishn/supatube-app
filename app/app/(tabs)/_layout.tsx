import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import ProfilePopover from '@/components/ProfilePopover';

export default function TabLayout() {
  const [showPopover, setShowPopover] = useState(false);
  const { token, user } = useAuth();
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#ff0000',
          tabBarInactiveTintColor: '#888',
          headerRight: () => (
            <View style={styles.headerRight}>
              {route.name === 'index' && (
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() => router.push('/(tabs)/search')}>
                  <FontAwesome name="search" size={20} color={'#333'} />
                </TouchableOpacity>
              )}
              {!!token && (
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/upload')}>
                  <FontAwesome name="upload" size={20} color={'#333'} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.profileBtn} onPress={() => setShowPopover(true)}>
                {token && user?.avatar_url ? (
                  <Image source={{ uri: getFullImageUrl(user.avatar_url) }} style={styles.avatar} />
                ) : (
                  <FontAwesome name="user-circle" size={24} color="#888" />
                )}
              </TouchableOpacity>
            </View>
          ),
        })}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: 'Subscriptions',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="youtube-play" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => <FontAwesome name="folder" size={size} color={color} />,
          }}
        />
        {/* Hidden tabs, navigated to programmatically */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
      </Tabs>

      <ProfilePopover
        visible={showPopover}
        onClose={() => setShowPopover(false)}
        onLogin={() => {
          setShowPopover(false);
          router.push('/(auth)/login');
        }}
        onRegister={() => {
          setShowPopover(false);
          router.push('/(auth)/register');
        }}
        onStudio={() => {
          setShowPopover(false);
          router.push('/studio');
        }}
        onSettings={() => {
          setShowPopover(false);
          router.push('/settings');
        }}
        loggedIn={!!token}
        user={user}
        onLogout={() => {
          setShowPopover(false);
          router.replace('/(tabs)/');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 16,
  },
  headerBtn: {
    padding: 8,
  },
  profileBtn: {
    // marginRight: 16,
    // padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
