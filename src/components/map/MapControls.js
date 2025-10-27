import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 地图控制按钮组件
 * 包含定位、放大、缩小按钮
 */
const MapControls = ({ onLocate, onZoomIn, onZoomOut }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.controlButton} onPress={onLocate}>
        <Text style={styles.controlIcon}>⊙</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onZoomIn}>
        <Text style={styles.controlIcon}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onZoomOut}>
        <Text style={styles.controlIcon}>−</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: theme.spacing.md,
    top: Platform.OS === 'ios' ? 120 : 110,
    zIndex: 5,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  controlIcon: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

export default MapControls;
