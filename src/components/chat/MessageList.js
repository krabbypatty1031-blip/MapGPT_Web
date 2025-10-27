import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { theme } from '../../constants/theme';
import MessageBubble from './MessageBubble';

/**
 * 消息列表组件
 * @param {Array} messages - 消息列表
 * @param {boolean} isLoading - 是否正在加载
 */
const MessageList = ({ messages, isLoading }) => {
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isUser={msg.type === 'user'}
        />
      ))}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>AI正在思考...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
});

export default MessageList;
