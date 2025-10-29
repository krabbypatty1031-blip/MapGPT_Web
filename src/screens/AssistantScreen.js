import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { HKBU_LOCATION, CAMPUS_MARKERS } from '../constants/mapData';
import Header from '../components/common/Header';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import QuickActions from '../components/chat/QuickActions';
import PresetQuestions from '../components/chat/PresetQuestions';
import MapModal from '../components/map/MapModal';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useImage } from '../hooks/useImage';

const AssistantScreen = ({ navigation }) => {
  const { messages, isLoading, sendMessage } = useChat();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  const { images, uploadProgress, pickAndUploadImage, removeImage, clearImages } = useImage();
  const [selectedAction, setSelectedAction] = useState(null);
  const [chatInputHeight, setChatInputHeight] = useState(60);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [currentMapData, setCurrentMapData] = useState(null);

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
    
    // 设置地图数据（使用默认的校园数据）
    setCurrentMapData({
      message: message,
      // 使用预定义的浸大位置
      region: HKBU_LOCATION,
      // 使用预定义的校园标记点
      markers: CAMPUS_MARKERS,
    });
    
    // 显示地图弹窗
    setIsMapVisible(true);
  };

  // 关闭地图弹窗
  const handleCloseMap = () => {
    setIsMapVisible(false);
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

      {/* 地图弹出窗 */}
      <MapModal
        visible={isMapVisible}
        onClose={handleCloseMap}
        initialRegion={currentMapData?.region}
        markers={currentMapData?.markers}
        chatInputHeight={chatInputHeight}
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
