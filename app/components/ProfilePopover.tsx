import React from 'react';
import { Modal, TouchableWithoutFeedback, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ProfilePopoverProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  loggedIn: boolean;
}

export default function ProfilePopover({
  visible,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  loggedIn
}: ProfilePopoverProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <View style={styles.popover}>
        {loggedIn ? (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onLogout}
          >
            <FontAwesome name="sign-out" size={20} color="#333" />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={onLogin}
            >
              <FontAwesome name="sign-in" size={20} color="#333" />
              <Text style={styles.menuText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={onRegister}
            >
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
    backgroundColor: 'rgba(0,0,0,0)'
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
    minWidth: 140,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
