import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import ProfilePopover from '@/components/ProfilePopover';

export default function TabLayout() {
  const [showPopover, setShowPopover] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  return (
    <>
      <Tabs screenOptions={{ 
        headerRight: () => (
          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={() => setShowPopover(true)}
          >
            <FontAwesome name="user-circle" size={24} color={token ? '#ff0000' : '#888'} />
          </TouchableOpacity>
        ),
      }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
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
        loggedIn={!!token}
        onLogout={() => {
          setShowPopover(false);
          router.replace('/(tabs)/');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileBtn: {
    marginRight: 16,
    padding: 8,
  },
});
