import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';
import { theme } from '../../constants/theme';

/**
 * 消息气泡组件 - 根据 Figma 设计更新
 * @param {Object} message - 消息对象
 * @param {boolean} isUser - 是否为用户消息
 * @param {Function} onViewMap - 查看地图回调（仅在特定功能下显示）
 * @param {Function} getMessageText - 获取消息文本的函数（用于流式消息）
 */
const MessageBubble = ({ message, isUser, onViewMap, getMessageText }) => {
  const [cursorOpacity] = useState(new Animated.Value(1));

  // 闪烁光标动画
  useEffect(() => {
    if (message.isStreaming) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();

      return () => blinkAnimation.stop();
    }
  }, [message.isStreaming, cursorOpacity]);

  // 判断是否应该显示"查看地图"按钮
  // 只有 AI 消息且功能为 route（路线规划）或 location（智能找点）时才显示
  const shouldShowMapButton = !isUser && message.action && 
    (message.action === 'route' || message.action === 'location');

  if (isUser) {
    return (
      <LinearGradient
        colors={['rgba(30, 131, 255, 0.95)', 'rgba(51, 153, 255, 0.95)', 'rgba(30, 206, 255, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        angle={92.1}
        style={[styles.bubble, styles.userBubble]}
      >
        {/* 显示图片 */}
        {message.images && message.images.length > 0 && (
          <View style={styles.imageContainer}>
            {message.images.map((image, index) => (
              <Image
                key={image.id || index}
                source={{ uri: image.url || image.uri }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
        <Text style={styles.userText}>
          {message.text}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.aiContainer}>
      <View style={styles.aiWrapper}>
        <View style={[styles.bubble, styles.aiBubble]}>
          <Markdown
            style={{
              body: styles.aiText,
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              paragraph: { marginBottom: 8 },
              heading1: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
              heading2: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
              heading3: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
              list_item: { marginBottom: 4 },
              bullet_list: { marginBottom: 8 },
              ordered_list: { marginBottom: 8 },
              code_inline: { backgroundColor: '#f0f0f0', paddingHorizontal: 4, borderRadius: 4 },
              code_block: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 4, fontFamily: 'monospace' },
              blockquote: { borderLeftWidth: 4, borderLeftColor: '#ccc', paddingLeft: 8, marginLeft: 8 },
              link: { color: '#0066cc' },
              image: { maxWidth: '100%', resizeMode: 'contain' }
            }}
          >
            {getMessageText ? getMessageText(message) : message.text}
          </Markdown>
          {message.isStreaming && (
            <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
              |
            </Animated.Text>
          )}

          {message.analysis && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>
                {message.analysis.type === 'ocr' ? 'OCR 识别结果' : '图片分析'}
              </Text>

              {Array.isArray(message.analysis.tags) && message.analysis.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {message.analysis.tags.map((tag, index) => (
                    <View key={`${tag}-${index}`} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {Array.isArray(message.analysis.recommendations) && message.analysis.recommendations.length > 0 && (
                <View style={styles.recommendationContainer}>
                  <Text style={styles.recommendationTitle}>推荐操作</Text>
                  {message.analysis.recommendations.map((item, index) => (
                    <Text key={`${item}-${index}`} style={styles.recommendationText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        
        {shouldShowMapButton && (
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => onViewMap && onViewMap(message)}
            activeOpacity={0.7}
          >
            <Text style={styles.mapButtonText}>查看地图</Text>
            <View style={styles.mapButtonIconContainer}>
              <Svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <Path 
                  d="M1 1L5 5L1 9" 
                  stroke="#0090F0" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: 355,
    borderRadius: 8,
    borderBottomRightRadius: 0,
    marginBottom: 12,
  },
  aiContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiWrapper: {
    maxWidth: 355,
    alignItems: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  messageImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  aiText: {
    color: '#1D2129',
    fontSize: 15,
    lineHeight: 22,
  },
  cursor: {
    color: '#0090F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
  analysisContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    gap: 8,
  },
  analysisTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D2129',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F4FD',
  },
  tagText: {
    fontSize: 12,
    color: '#0072E3',
  },
  recommendationContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E6EB',
    paddingTop: 8,
    gap: 4,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D2129',
  },
  recommendationText: {
    fontSize: 12,
    color: '#4E5969',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#0090F0',
    fontWeight: '600',
    lineHeight: 14,
  },
  mapButtonIconContainer: {
    width: 12,
    height: 12,
    backgroundColor: '#DDF2FF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MessageBubble;

