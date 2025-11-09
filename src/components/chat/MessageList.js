import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
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
const QUICK_ACTION_SAFE_SPACE = Platform.OS === 'web' ? 240 : 140; // Web 端保留更大底部空间，避免固定定位的输入区遮挡最新消息

const MessageList = ({
  messages,
  isLoading,
  onViewMap,
  getMessageText,
  chatInputHeight = 60,
  headerExtra = null,
}) => {
  const scrollRef = useRef(null);
  const bottomPadding = Math.max(chatInputHeight + QUICK_ACTION_SAFE_SPACE, 180);
  const webScrollableHeight = useMemo(() => {
    if (Platform.OS !== 'web') {
      return null;
    }

    const totalOffset = chatInputHeight + QUICK_ACTION_SAFE_SPACE + 40;
    return `calc(100vh - ${totalOffset}px)`;
  }, [chatInputHeight]);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollToEnd?.({ animated: true });

    if (Platform.OS === 'web') {
      const node = scrollRef.current.getScrollableNode?.();
      if (node) {
        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading, scrollToBottom]);

  return (
    <ScrollView
      ref={scrollRef}
      style={[
        styles.container,
        Platform.OS === 'web' && styles.containerWeb,
        Platform.OS === 'web' && { maxHeight: webScrollableHeight, height: webScrollableHeight },
      ]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomPadding },
        Platform.OS === 'web' && styles.contentWeb,
      ]}
      scrollIndicatorInsets={{ bottom: bottomPadding }}
      showsVerticalScrollIndicator
      onContentSizeChange={scrollToBottom}
    >
      {/* AI助手头像和欢迎语 - 始终显示在顶部 */}
      <ChatHeader />
      {headerExtra}
      
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
  containerWeb: {
    // Web 端显式限定滚动区域高度，避免因 fixed 底栏导致页面整体无法滚动
    width: '100%',
    overflow: 'auto',
  },
  content: {
    // paddingBottom 现在通过内联样式动态设置
  },
  contentWeb: {
    // 确保在 Web 环境下内容至少撑满滚动容器，允许滚动条正确计算高度
    minHeight: '100%',
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
