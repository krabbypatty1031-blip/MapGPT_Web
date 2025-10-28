import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { theme } from '../../constants/theme';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';

/**
 * 消息列表组件
 * @param {Array} messages - 消息列表
 * @param {boolean} isLoading - 是否正在加载
 * @param {Function} onViewMap - 查看地图回调
 */
const MessageList = ({ messages, isLoading, onViewMap }) => {
  const scrollViewRef = useRef(null);

  // 滚动到底部的函数
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  // 当消息列表变化时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages]);

  // 当加载状态变化时也滚动到底部
  useEffect(() => {
    if (isLoading) {
      scrollToBottom(true);
    }
  }, [isLoading]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollToBottom(true)}
      onLayout={() => scrollToBottom(false)}
    >
      {/* AI助手头像和欢迎语 - 始终显示在顶部 */}
      <ChatHeader />
      
      <View style={styles.messagesContainer}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isUser={msg.type === 'user'}
            onViewMap={onViewMap}
          />
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>AI正在思考...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.md,
  },
  messagesContainer: {
    paddingHorizontal: 10, // 左右各10px，确保355px的气泡能正常显示
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
