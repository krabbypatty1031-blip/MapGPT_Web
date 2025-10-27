import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { MicrophoneIcon, KeyboardIcon } from '../icons';

/**
 * 聊天输入框组件
 * @param {Function} onSendMessage - 发送消息回调
 * @param {Function} onMicPress - 麦克风按钮回调  
 * @param {Function} onVoicePress - 语音按钮回调 (长按)
 * @param {boolean} disabled - 是否禁用
 * @param {boolean} isVoiceMode - 是否为语音模式
 * @param {Function} onToggleMode - 切换输入模式回调
 */
const ChatInput = ({
  onSendMessage,
  onMicPress,
  disabled = false,
  isVoiceMode = false,
  onToggleMode,
  voiceComponent,
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
          <View style={styles.innerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onToggleMode}
            >
              <MicrophoneIcon size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="您可以问我任何问题～"
                placeholderTextColor={theme.colors.textLight}
                multiline
                maxLength={500}
                editable={!disabled}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!text.trim() || disabled) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!text.trim() || disabled}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.innerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onToggleMode}
            >
              <KeyboardIcon size={20} color="#666" />
            </TouchableOpacity>
            
            {voiceComponent}
            
            <View style={styles.spacer} />
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
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  container: {
    width: 355,
    height: 60,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: 'rgba(6, 0, 46, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 323,
    height: 24,
  },
  iconButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: 24,
  },
  input: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
    height: 24,
  },
  sendButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendIcon: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    width: 24,
    height: 24,
  },
});

export default ChatInput;
