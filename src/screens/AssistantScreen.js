/**
 * AssistantScreen - AI 助手主屏幕
 * 集成聊天、语音、图片、地图等功能
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 组件
import Header from '../components/common/Header';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import QuickActions from '../components/chat/QuickActions';
import PresetQuestions from '../components/chat/PresetQuestions';
import MapModal from '../components/map/MapModal';

// Hooks
import { useChat, useVoice, useImage, useMapModal, useMessageHandlers } from '../hooks';

/**
 * AI 助手主屏幕组件
 * @param {Object} props - 组件属性
 * @param {Object} props.navigation - 导航对象
 */
const AssistantScreen = ({ navigation }) => {
  // ==================== 状态管理 ====================
  const [selectedAction, setSelectedAction] = useState(null);
  const [chatInputHeight, setChatInputHeight] = useState(60);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // 是否为语音输入模式

  // ==================== Hooks ====================
  // 聊天功能
  const { messages, isLoading, sendMessage, getMessageText, appendAssistantMessage } = useChat();
  
  // 语音功能
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  
  // 图片功能
  const { images, uploadProgress, pickAndUploadImage, removeImage, clearImages, analyzeImage } = useImage();
  
  // 地图模态框
  const {
    isMapVisible,
    currentMapData,
    markers,
    handleViewMap,
    handleCloseMap,
    clearRouteLocations,
  } = useMapModal(messages);
  
  // 消息处理
  const { handleSendMessage } = useMessageHandlers({
    selectedAction,
    images,
    clearImages,
    sendMessage,
    analyzeImage,
    appendAssistantMessage,
    clearRouteLocations,
  });

  // ==================== 事件处理器 ====================
  /**
   * 处理语音输入
   */
  const handleVoiceInput = useCallback(
    async (recognizedText) => {
      if (recognizedText) {
        await handleSendMessage(recognizedText);
      }
    },
    [handleSendMessage],
  );

  /**
   * 处理图片选择
   */
  const handleImagePress = useCallback(async () => {
    await pickAndUploadImage();
  }, [pickAndUploadImage]);

  /**
   * 开始录音
   */
  const handleVoiceRecordStart = useCallback(async () => {
    if (!isProcessing) {
      await startRecording();
    }
  }, [isProcessing, startRecording]);

  /**
   * 结束录音
   */
  const handleVoiceRecordEnd = useCallback(async () => {
    const result = await stopRecording(selectedAction);
    if (result.success && result.text) {
      await handleVoiceInput(result.text);
    }
  }, [stopRecording, selectedAction, handleVoiceInput]);

  /**
   * 切换输入模式（文字/语音）
   */
  const handleToggleMode = useCallback(() => {
    setIsVoiceMode((prev) => !prev);
  }, []);

  /**
   * 处理语音按钮点击（切换到语音模式）
   */
  const handleVoicePress = useCallback(() => {
    setIsVoiceMode(true);
  }, []);

  /**
   * 处理返回按钮
   */
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ==================== 渲染 ====================
  return (
    <LinearGradient colors={['#F5F7FA', '#E8EEF5']} style={styles.container}>
      {/* 头部 */}
      <Header title="香港浸会大学" onBack={handleBack} />

      {/* 主内容区域 */}
      <View style={styles.content}>
        {messages.length > 0 ? (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onViewMap={handleViewMap}
            getMessageText={getMessageText}
            chatInputHeight={chatInputHeight}
          />
        ) : (
          <ScrollView
            style={styles.presetScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <PresetQuestions
              onSelectQuestion={handleSendMessage}
              selectedAction={selectedAction}
            />
          </ScrollView>
        )}
      </View>

      {/* 快捷操作按钮 */}
      <QuickActions
        selectedAction={selectedAction}
        onSelectAction={setSelectedAction}
        chatInputHeight={chatInputHeight}
      />

      {/* 聊天输入框 */}
      <ChatInput
        key={`chat-input-${images.length}-${selectedAction}`}
        onSendMessage={handleSendMessage}
        onImagePress={handleImagePress}
        onVoicePress={handleVoicePress}
        onToggleMode={handleToggleMode}
        onVoiceRecordStart={handleVoiceRecordStart}
        onVoiceRecordEnd={handleVoiceRecordEnd}
        disabled={isLoading || !selectedAction}
        isVoiceMode={isVoiceMode}
        isRecording={isRecording}
        images={images}
        onImagesChange={removeImage}
        uploadProgress={uploadProgress}
        onHeightChange={setChatInputHeight}
        selectedAction={selectedAction}
      />

      {/* 地图模态框 */}
      <MapModal
        visible={isMapVisible}
        onClose={handleCloseMap}
        initialRegion={currentMapData?.region}
        markers={markers}
        chatInputHeight={chatInputHeight}
      />
    </LinearGradient>
  );
};

// ==================== 样式 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  presetScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
});

export default AssistantScreen;
