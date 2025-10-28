import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '../../constants/theme';
import { ImageIcon, VoiceIcon, KeyboardIcon, SendIcon } from '../icons';

/**
 * 聊天输入框组件 - 根据 Figma 设计更新
 * @param {Function} onSendMessage - 发送消息回调
 * @param {Function} onImagePress - 图片按钮回调
 * @param {Function} onVoicePress - 语音按钮回调（切换到语音模式）
 * @param {Function} onVoiceRecordStart - 开始录音回调
 * @param {Function} onVoiceRecordEnd - 结束录音回调
 * @param {boolean} disabled - 是否禁用
 * @param {boolean} isVoiceMode - 是否为语音模式
 * @param {Function} onToggleMode - 切换输入模式回调
 * @param {boolean} isRecording - 是否正在录音
 */
const ChatInput = ({
  onSendMessage,
  onImagePress,
  onVoicePress,
  onVoiceRecordStart,
  onVoiceRecordEnd,
  disabled = false,
  isVoiceMode = false,
  onToggleMode,
  isRecording = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {!isVoiceMode ? (
          // 文字输入模式
          <View style={styles.innerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onImagePress}
            >
              <ImageIcon size={22} color="#1D2129" />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, disabled && styles.inputDisabled]}
                value={text}
                onChangeText={setText}
                placeholder={disabled ? "请先选择上方功能..." : "输入消息..."}
                placeholderTextColor={disabled ? "#C9CDD4" : "#86909C"}
                multiline
                maxLength={500}
                editable={!disabled}
              />
            </View>

            {text.trim() ? (
              // 有文字输入时显示发送按钮
              <TouchableOpacity
                style={[styles.iconButton, styles.sendButton]}
                onPress={handleSend}
                disabled={disabled}
              >
                <SendIcon size={24} />
              </TouchableOpacity>
            ) : (
              // 没有文字输入时显示语音按钮
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onVoicePress}
              >
                <VoiceIcon size={22} color="#1D2129" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // 语音输入模式
          <View style={styles.innerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onImagePress}
            >
              <ImageIcon size={22} color="#1D2129" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.voiceButton}
              onPressIn={onVoiceRecordStart}
              onPressOut={onVoiceRecordEnd}
              activeOpacity={0.9}
              disabled={disabled}
            >
              <MaskedView
                style={styles.maskedViewContainer}
                maskElement={
                  <View style={styles.maskElementContainer}>
                    <Text style={styles.voiceButtonTextMask}>
                      {isRecording ? '松开发送' : '按住开始说话'}
                    </Text>
                  </View>
                }
              >
                <LinearGradient
                  colors={['#598AE9', '#2099FF', '#35B8FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.voiceButtonGradient}
                >
                  <Text style={styles.voiceButtonText}>
                    {isRecording ? '松开发送' : '按住开始说话'}
                  </Text>
                </LinearGradient>
              </MaskedView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={onToggleMode}
            >
              <KeyboardIcon size={22} color="#1D2129" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  container: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 32,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
  },
  sendButton: {
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: 32,
  },
  input: {
    fontSize: 15,
    color: '#1D2129',
    padding: 0,
    margin: 0,
    lineHeight: 22,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    color: '#C9CDD4',
  },
  voiceButton: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskedViewContainer: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskElementContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  voiceButtonGradient: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonTextMask: {
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: 'transparent',
    textAlign: 'center',
    lineHeight: 22,
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'transparent',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatInput;

