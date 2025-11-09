import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { messages, isLoading, sendMessage, getMessageText, appendAssistantMessage } = useChat();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  const { images, uploadProgress, pickAndUploadImage, removeImage, clearImages, analyzeImage } = useImage();
  const [selectedAction, setSelectedAction] = useState(null);
  const [chatInputHeight, setChatInputHeight] = useState(60);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [currentMapData, setCurrentMapData] = useState(null);
  const [routeLocations, setRouteLocations] = useState([]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (
      latestMessage &&
      latestMessage.type === 'ai' &&
      Array.isArray(latestMessage.locations) &&
      latestMessage.locations.length > 0
    ) {
      const validLocations = latestMessage.locations.filter(
        (location) =>
          location &&
          typeof location.latitude === 'number' &&
          typeof location.longitude === 'number' &&
          location.latitude >= -90 &&
          location.latitude <= 90 &&
          location.longitude >= -180 &&
          location.longitude <= 180,
      );

      if (validLocations.length > 0) {
        setRouteLocations(validLocations);
        setIsMapVisible(true);
      }
    }
  }, [messages]);

  const handleImageAnalysis = useCallback(
    async (imageList = []) => {
      for (const image of imageList) {
        if (!image?.url) {
          continue;
        }

        try {
          const result = await analyzeImage(image.url, 'landmark');
          if (result?.success && result.data) {
            const { caption, tags, recommendations, analysisType } = result.data;
            appendAssistantMessage({
              text: caption,
              action: 'image',
              images: [{ id: image.id, url: image.url }],
              analysis: {
                type: analysisType || 'landmark',
                tags,
                recommendations,
              },
            });
          }
        } catch (error) {
          console.error('[AssistantScreen] 图片分析失败:', error);
        }
      }
    },
    [analyzeImage, appendAssistantMessage],
  );

  const handleSendMessage = useCallback(
    async (text) => {
      if (!selectedAction) {
        return;
      }

      const currentImages = [...images];
      const currentAction = selectedAction;

      clearImages();
      setSelectedAction(null);
      setRouteLocations([]);

      await sendMessage(text, currentAction, currentImages);

      if (currentAction === 'image') {
        await handleImageAnalysis(currentImages);
      }
    },
    [selectedAction, images, clearImages, sendMessage, handleImageAnalysis],
  );

  const handleVoiceInput = useCallback(
    async (recognizedText) => {
      if (recognizedText) {
        await handleSendMessage(recognizedText);
      }
    },
    [handleSendMessage],
  );

  const handleImagePress = useCallback(async () => {
    await pickAndUploadImage();
  }, [pickAndUploadImage]);

  const handleVoiceRecordStart = useCallback(async () => {
    if (!isProcessing) {
      await startRecording();
    }
  }, [isProcessing, startRecording]);

  const handleVoiceRecordEnd = useCallback(async () => {
    const result = await stopRecording(selectedAction);
    if (result.success && result.text) {
      await handleVoiceInput(result.text);
    }
  }, [stopRecording, selectedAction, handleVoiceInput]);

  const handleViewMap = useCallback((message) => {
    setCurrentMapData({
      message,
      region: HKBU_LOCATION,
      markers: CAMPUS_MARKERS,
    });
    setIsMapVisible(true);
  }, []);

  const handleCloseMap = useCallback(() => {
    setIsMapVisible(false);
  }, []);

  const markers = useMemo(
    () => [
      ...(currentMapData?.markers || []).filter(
        (marker) =>
          marker.coordinate &&
          typeof marker.coordinate.latitude === 'number' &&
          typeof marker.coordinate.longitude === 'number',
      ),
      ...routeLocations
        .filter(
          (location) =>
            typeof location.latitude === 'number' &&
            typeof location.longitude === 'number' &&
            location.latitude >= -90 &&
            location.latitude <= 90 &&
            location.longitude >= -180 &&
            location.longitude <= 180,
        )
        .map((location) => ({
          id: `route-${location.id}`,
          coordinate: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          title: location.name,
          description: `${location.type} - ${location.name}`,
          type: location.type,
        })),
    ],
    [currentMapData?.markers, routeLocations],
  );

  return (
    <LinearGradient colors={['#F5F7FA', '#E8EEF5']} style={styles.container}>
      <Header title="香港浸会大学" onBack={() => navigation.goBack()} />

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
          <ScrollView style={styles.presetScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <PresetQuestions onSelectQuestion={handleSendMessage} selectedAction={selectedAction} />
          </ScrollView>
        )}
      </View>

      <QuickActions selectedAction={selectedAction} onSelectAction={setSelectedAction} chatInputHeight={chatInputHeight} />

      <ChatInput
        key={`chat-input-${images.length}-${selectedAction}`}
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
  presetScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
});

export default AssistantScreen;
