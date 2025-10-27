import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { QUICK_ACTIONS } from '../../constants/chatData';

/**
 * 快捷功能按钮组
 * @param {string} selectedAction - 当前选中的功能ID
 * @param {Function} onSelectAction - 选择功能的回调
 */
const QuickActions = ({ selectedAction, onSelectAction }) => (
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
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    zIndex: 5,
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
