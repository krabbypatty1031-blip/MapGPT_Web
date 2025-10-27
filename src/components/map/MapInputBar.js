import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 地图输入栏组件
 * 包含相机、相册按钮和输入提示
 */
const MapInputBar = ({ onCameraPress, onGalleryPress, onSendPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={onCameraPress}>
        <Text style={styles.icon}>📷</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton} onPress={onGalleryPress}>
        <Text style={styles.icon}>🖼️</Text>
      </TouchableOpacity>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputText}>Need help? Just ask me...</Text>
      </View>
      
      <TouchableOpacity style={styles.sendButton} onPress={onSendPress}>
        <Text style={styles.sendIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
  },
  inputText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default MapInputBar;
