import React from 'react';
import { Modal, TouchableWithoutFeedback, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

interface ProfilePopoverProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onStudio: () => void;
  onSettings: () => void;
  loggedIn: boolean;
  user: any | null;
}

export default function ProfilePopover({
  visible,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  onStudio,
  onSettings,
  loggedIn,
  user,
}: ProfilePopoverProps) {
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    onLogout();
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.popover}>
        {loggedIn && user && (
          <View style={styles.userInfo}>
            <FontAwesome name="user-circle-o" size={40} color="#555" />
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userHandle}>@{user.username}</Text>
            </View>
          </View>
        )}

        {loggedIn ? (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={onStudio}>
              <FontAwesome name="youtube-play" size={18} color="#333" />
              <Text style={styles.menuText}>Creator Studio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onSettings}>
              <FontAwesome name="cog" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <FontAwesome name="sign-out" size={20} color="#333" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={onLogin}>
              <FontAwesome name="sign-in" size={20} color="#333" />
              <Text style={styles.menuText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onRegister}>
              <FontAwesome name="user-plus" size={18} color="#333" />
              <Text style={styles.menuText}>Register</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  popover: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 180,
    zIndex: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: { fontWeight: 'bold' },
  userHandle: { color: '#666' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});
