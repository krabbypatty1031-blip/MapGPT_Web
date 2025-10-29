import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 通用页面头部组件
 * @param {string} title - 标题文字
 * @param {Function} onBack - 返回按钮回调
 * @param {React.ReactNode} rightComponent - 右侧自定义组件
 */
const Header = ({ title, onBack, rightComponent }) => (
  <View style={styles.container}>
    {onBack && (
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
    )}
    
    <Text style={styles.title}>{title}</Text>
    
    <View style={styles.rightContainer}>
      {rightComponent || <View style={styles.placeholder} />}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 36,
    color: theme.colors.text,
    fontWeight: '300',
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.spacing.xl + 15, // 直接定位标题，使其与箭头视觉对齐
    textAlign: 'center',
  },
  rightContainer: {
    width: 40,
    height: 40,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

export default Header;
