import React, { useState, useEffect, useMemo } from 'react';
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
  const { messages, isLoading, sendMessage, getMessageText } = useChat();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  const { images, uploadProgress, pickAndUploadImage, removeImage, clearImages } = useImage();
  const [selectedAction, setSelectedAction] = useState(null);
  const [chatInputHeight, setChatInputHeight] = useState(60);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [currentMapData, setCurrentMapData] = useState(null);
  const [routeLocations, setRouteLocations] = useState([]); // 存储route action的地点信息

  // 监听消息变化，处理route locations
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.type === 'ai' && latestMessage.locations && Array.isArray(latestMessage.locations) && latestMessage.locations.length > 0) {
      console.log('[AssistantScreen] 检测到route locations:', latestMessage.locations);
      // 过滤掉无效的locations
      const validLocations = latestMessage.locations.filter(location => 
        location && 
        typeof location.latitude === 'number' && 
        typeof location.longitude === 'number' &&
        location.latitude >= -90 && location.latitude <= 90 &&
        location.longitude >= -180 && location.longitude <= 180
      );
      
      if (validLocations.length > 0) {
        setRouteLocations(validLocations);
        setIsMapVisible(true);
      } else {
        console.warn('[AssistantScreen] 没有有效的route locations');
      }
    }
  }, [messages]);

  // 处理消息发送（需要先选择快捷操作）
  const handleSendMessage = async (text) => {
    console.log('[AssistantScreen] handleSendMessage:', { text, selectedAction, images });
    if (!selectedAction) {
      console.log('请先选择一个功能（路线规划、智能找点、拍图提问或语音讲解）');
      return;
    }
    
    // 保存当前的图片和选择状态，用于发送
    const currentImages = [...images];
    const currentAction = selectedAction;
    
    // 立即清理界面
    clearImages();
    setSelectedAction(null);
    setRouteLocations([]); // 清空之前的route locations
    console.log('[AssistantScreen] 界面已清理，开始发送消息');
    
    // 发送消息
    await sendMessage(text, currentAction, currentImages);
    console.log('[AssistantScreen] 消息发送完成');
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

  // 优化markers数组的稳定性
  const markers = useMemo(() => [
    ...(currentMapData?.markers || []).filter(marker =>
      marker.coordinate &&
      typeof marker.coordinate.latitude === 'number' &&
      typeof marker.coordinate.longitude === 'number'
    ),
    ...routeLocations
      .filter(location =>
        typeof location.latitude === 'number' &&
        typeof location.longitude === 'number' &&
        location.latitude >= -90 && location.latitude <= 90 &&
        location.longitude >= -180 && location.longitude <= 180
      )
      .map(location => ({
        id: `route-${location.id}`,
        coordinate: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        title: location.name,
        description: `${location.type} - ${location.name}`,
        type: location.type,
      }))
  ], [currentMapData?.markers, routeLocations]);

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
            getMessageText={getMessageText}
            chatInputHeight={chatInputHeight}
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
        key={`chat-input-${images.length}-${selectedAction}`} // 强制重新渲染当图片或选择改变时
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
        markers={markers}
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
