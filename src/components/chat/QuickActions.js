import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { QUICK_ACTIONS } from '../../constants/chatData';

/**
 * 快捷功能按钮组
 * @param {string} selectedAction - 当前选中的功能ID
 * @param {Function} onSelectAction - 选择功能的回调
 * @param {number} chatInputHeight - ChatInput组件的高度，用于动态调整位置
 */
const QuickActions = ({ selectedAction, onSelectAction, chatInputHeight = 60 }) => (
  <View style={[styles.wrapper, { bottom: chatInputHeight + 23 }]}>
    {!selectedAction && (
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>👆 请先选择一个功能</Text>
      </View>
    )}
    <View style={styles.container}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.button,
            selectedAction === action.id && styles.buttonActive
          ]}
          onPress={() => onSelectAction(action.id === selectedAction ? null : action.id)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.text,
            selectedAction === action.id && styles.textActive
          ]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // bottom is now dynamically set via inline style
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  hintContainer: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hintText: {
    fontSize: 12,
    color: '#F53F3F',
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: 78,
    height: 33,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: 'rgba(6, 0, 46, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginHorizontal: 5,
  },
  buttonActive: {
    backgroundColor: '#E8F4FD',
  },
  text: {
    fontSize: 11,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  textActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default QuickActions;
