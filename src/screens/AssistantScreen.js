import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import QuickActions from '../components/chat/QuickActions';
import PresetQuestions from '../components/chat/PresetQuestions';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useImage } from '../hooks/useImage';

const AssistantScreen = ({ navigation }) => {
  const { messages, isLoading, sendMessage } = useChat();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  const { images, uploadProgress, pickAndUploadImage, removeImage, clearImages } = useImage();
  const [selectedAction, setSelectedAction] = useState(null);
  const [chatInputHeight, setChatInputHeight] = useState(60);

  // 处理消息发送（需要先选择快捷操作）
  const handleSendMessage = async (text) => {
    if (!selectedAction) {
      console.log('请先选择一个功能（路线规划、智能找点、拍图提问或语音讲解）');
      return;
    }
    
    await sendMessage(text, selectedAction, images);
    clearImages(); // 使用 Hook 的 clearImages
  };

  // 处理语音输入
  const handleVoiceInput = async (recognizedText) => {
    if (recognizedText) {
      await handleSendMessage(recognizedText);
    }
  };

  // 处理图片选择
  const handleImagePress = async () => {
    await pickAndUploadImage(); // 使用 Hook 的方法
  };

  // 处理语音录音
  const handleVoiceRecordStart = async () => {
    await startRecording(); // 使用 Hook 的方法
  };

  const handleVoiceRecordEnd = async () => {
    const result = await stopRecording(selectedAction); // 使用 Hook 的方法
    
    if (result.success && result.text) {
      await handleVoiceInput(result.text);
    }
  };

  // 处理"查看地图"按钮点击
  const handleViewMap = (message) => {
    console.log('查看地图，消息：', message);
    // TODO: 导航到地图页面或在地图上显示相关位置
    // navigation.navigate('Map', { query: message.text, action: message.action });
  };

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EEF5']} style={styles.container}>
      <Header
        title="香港浸会大学"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.length > 0 ? (
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            onViewMap={handleViewMap}
          />
        ) : (
          <PresetQuestions 
            onSelectQuestion={handleSendMessage}
            selectedAction={selectedAction}
          />
        )}
      </ScrollView>

      <QuickActions
        selectedAction={selectedAction}
        onSelectAction={setSelectedAction}
        chatInputHeight={chatInputHeight}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onImagePress={handleImagePress}
        onVoiceRecordStart={handleVoiceRecordStart}
        onVoiceRecordEnd={handleVoiceRecordEnd}
        disabled={isLoading || !selectedAction}
        isRecording={isRecording}
        images={images}
        onImagesChange={removeImage}
        uploadProgress={uploadProgress}
        onHeightChange={setChatInputHeight}
        selectedAction={selectedAction}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
});

export default AssistantScreen;
