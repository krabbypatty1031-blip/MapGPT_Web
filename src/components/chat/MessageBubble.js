import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../constants/theme';

/**
 * 消息气泡组件 - 根据 Figma 设计更新
 * @param {Object} message - 消息对象
 * @param {boolean} isUser - 是否为用户消息
 * @param {Function} onViewMap - 查看地图回调（仅在特定功能下显示）
 */
const MessageBubble = ({ message, isUser, onViewMap }) => {
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
          <Text style={styles.aiText}>
            {message.text}
          </Text>
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
  aiText: {
    color: '#1D2129',
    fontSize: 15,
    lineHeight: 22,
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

