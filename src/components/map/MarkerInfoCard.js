import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 地图标记信息卡片组件
 * 显示选中标记的详细信息
 */
const MarkerInfoCard = ({ marker, onClose, onNavigate }) => {
  if (!marker) return null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>{marker.title}</Text>
      <Text style={styles.subtitle}>{marker.subtitle}</Text>
      
      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
        <Text style={styles.navigateButtonText}>导航到此地</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 200,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: theme.colors.textLight,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    paddingRight: 32,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  navigateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});

export default MarkerInfoCard;
