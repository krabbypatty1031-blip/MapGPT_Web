import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { theme } from '../../constants/theme';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';

/**
 * 消息列表组件
 * @param {Array} messages - 消息列表
 * @param {boolean} isLoading - 是否正在加载
 * @param {Function} onViewMap - 查看地图回调
 * @param {Function} getMessageText - 获取消息文本的函数（用于流式消息）
 * @param {number} chatInputHeight - ChatInput组件的高度，用于计算底部padding
 */
const MessageList = ({ messages, isLoading, onViewMap, getMessageText, chatInputHeight = 60 }) => {

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
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
            getMessageText={getMessageText}
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
    // paddingBottom 现在通过内联样式动态设置
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
