import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 消息气泡组件
 * @param {Object} message - 消息对象
 * @param {boolean} isUser - 是否为用户消息
 */
const MessageBubble = ({ message, isUser }) => (
  <View style={[
    styles.bubble,
    isUser ? styles.userBubble : styles.aiBubble
  ]}>
    <Text style={[
      styles.text,
      isUser ? styles.userText : styles.aiText
    ]}>
      {message.text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '75%',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  userText: {
    color: theme.colors.white,
  },
  aiText: {
    color: theme.colors.text,
  },
});

export default MessageBubble;
