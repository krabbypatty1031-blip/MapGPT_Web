import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Circle, Path } from 'react-native-svg';
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
 * @param {Array} images - 图片列表
 * @param {Function} onImagesChange - 删除图片回调，传入 imageId
 * @param {Object} uploadProgress - 上传进度
 * @param {string} selectedAction - 当前选中的功能
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
  images = [],
  onImagesChange,
  uploadProgress = {},
  onHeightChange, // New prop to notify height changes
  selectedAction,
}) => {
  const [inputText, setInputText] = useState('');

  // Calculate and notify height changes
  useEffect(() => {
    if (onHeightChange) {
      // Base container height: 60px (approximately paddingVertical: 14*2 + content ~32)
      const baseHeight = 60;
      
      // Image container height when visible
      // Each row: 80px image + 10px gap, rounded up rows
      // Container padding: 16 top + 12 bottom = 28
      let imageContainerHeight = 0;
      if (images.length > 0) {
        const itemsPerRow = 4;
        const rows = Math.ceil((images.length + 1) / itemsPerRow); // +1 for add button
        imageContainerHeight = 16 + (rows * 80) + ((rows - 1) * 10) + 12;
      }
      
      const totalHeight = baseHeight + imageContainerHeight;
      onHeightChange(totalHeight);
    }
  }, [images.length, onHeightChange]);


  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // 删除图片 - 直接调用父组件的删除函数
  const handleRemoveImage = (imageId) => {
    if (onImagesChange) {
      onImagesChange(imageId);
    }
  };

  // 渲染单个图片
  const renderImageItem = (image) => {
    const progress = uploadProgress[image.id] || 0;
    const isUploading = image.uploading && !image.error;

    return (
      <View key={image.id} style={styles.imageItem}>
        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        
        {/* 上传进度遮罩 */}
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              {/* 背景圆 */}
              <Circle
                cx="20"
                cy="20"
                r="18"
                stroke="#E5E6EB"
                strokeWidth="3"
                fill="none"
              />
              {/* 进度圆 */}
              <Circle
                cx="20"
                cy="20"
                r="18"
                stroke="#0090F0"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </Svg>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* 删除按钮 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveImage(image.id)}
          activeOpacity={0.7}
        >
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Circle cx="10" cy="10" r="10" fill="#000000" opacity="0.5" />
            <Path
              d="M6 6L14 14M14 6L6 14"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染添加按钮
  const renderAddButton = () => {
    if (images.length >= 9 || selectedAction !== 'image') return null;

    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={onImagePress}
        activeOpacity={0.7}
      >
        <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <Path
            d="M16 8V24M8 16H24"
            stroke="#86909C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        Platform.OS === 'web' ? styles.wrapperWeb : styles.wrapperNative,
      ]}
    >
      {/* 图片区域 - 在输入框上方 */}
      {images.length > 0 && (
        <View style={styles.imageContainer}>
          <View style={styles.imageList}>
            {images.map(image => renderImageItem(image))}
            {renderAddButton()}
          </View>
        </View>
      )}

      {/* 输入框容器 */}
      <View style={[
        styles.container,
        images.length === 0 && styles.containerNoImages
      ]}>
        {!isVoiceMode ? (
          // 文字输入模式
          <View style={styles.innerRow}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                selectedAction !== 'image' && styles.iconButtonDisabled
              ]}
              onPress={selectedAction === 'image' ? onImagePress : null}
              disabled={selectedAction !== 'image'}
            >
              <ImageIcon 
                size={22} 
                color={selectedAction === 'image' ? "#1D2129" : "#C9CDD4"} 
              />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, disabled && styles.inputDisabled]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={disabled ? "请先选择上方功能..." : "输入消息..."}
                placeholderTextColor={disabled ? "#C9CDD4" : "#86909C"}
                multiline
                maxLength={500}
                editable={!disabled}
              />
            </View>

            {inputText.trim() ? (
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
              style={[
                styles.iconButton,
                selectedAction !== 'image' && styles.iconButtonDisabled
              ]}
              onPress={selectedAction === 'image' ? onImagePress : null}
              disabled={selectedAction !== 'image'}
            >
              <ImageIcon 
                size={22} 
                color={selectedAction === 'image' ? "#1D2129" : "#C9CDD4"} 
              />
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
    // 统一左右边距与层级控制，保持组件与背景布局解耦，便于根据平台切换定位策略
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  wrapperNative: {
    // 原生端保持绝对定位贴底，兼容既有交互与动画
    position: 'absolute',
    bottom: 12,
  },
  wrapperWeb: {
    // web 端改用 fixed 锚定视口底部，避免消息列表拉长后对输入区造成挤压
    position: 'fixed',
    bottom: 12,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginBottom: -4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageItem: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F7F8FA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E5E6EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  containerNoImages: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  iconButtonDisabled: {
    opacity: 0.5,
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

