import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import QuickActions from '../components/chat/QuickActions';
import PresetQuestions from '../components/chat/PresetQuestions';
import { useChat } from '../hooks/useChat';
import * as VoiceService from '../services/voiceService';

const AssistantScreen = ({ navigation }) => {
  const { messages, isLoading, sendMessage } = useChat();
  const [selectedAction, setSelectedAction] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingAnim = useRef(new Animated.Value(1)).current;

  // 处理消息发送（需要先选择快捷操作）
  const handleSendMessage = async (text) => {
    if (!selectedAction) {
      // 如果没有选择快捷操作，不允许发送
      console.log('请先选择一个功能（路线规划、智能找点、拍图提问或语音讲解）');
      return;
    }
    
    // 发送消息时带上选择的功能类型
    await sendMessage(text, selectedAction);
  };

  const handleVoiceInput = async (recognizedText) => {
    if (recognizedText) {
      await handleSendMessage(recognizedText);
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'text' ? 'voice' : 'text');
    setIsRecording(false);
  };

  const handleImagePress = () => {
    console.log('图片按钮点击');
    // TODO: 实现图片选择功能
  };

  const handleVoicePress = () => {
    console.log('语音按钮点击 - 切换到语音模式');
    toggleInputMode();
  };

  const startRecording = async () => {
    if (isProcessing || isRecording) {
      console.log('录音正在进行中');
      return;
    }

    setIsProcessing(true);
    setIsRecording(true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const result = await VoiceService.startRecording();
    if (!result.success) {
      console.log('录音失败:', result.error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    recordingAnim.setValue(1);

    try {
      const result = await VoiceService.stopRecording();

      if (result.success) {
        if (selectedAction) {
          const voiceResult = await VoiceService.processVoiceWithAction(
            result.uri,
            selectedAction
          );
          await handleVoiceInput(voiceResult.text);
        } else {
          const sttResult = await VoiceService.speechToText(result.uri);
          const recognizedText = sttResult.success ? sttResult.text : sttResult.mockText;
          await handleVoiceInput(recognizedText);
        }
      } else {
        if (selectedAction) {
          const mockText = getMockTextByAction(selectedAction);
          await handleVoiceInput(mockText);
        }
      }
    } catch (error) {
      console.error('录音处理错误:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMockTextByAction = (action) => {
    const mockTexts = {
      route: '从图书馆到食堂怎么走？',
      location: '最近的咖啡厅在哪里？',
      image: '这是什么建筑？',
      voice: '给我讲讲这个地方的历史。',
    };
    return mockTexts[action] || '你好，我想了解校园信息。';
  };

  // 处理"查看地图"按钮点击
  const handleViewMap = (message) => {
    console.log('查看地图，消息：', message);
    // TODO: 导航到地图页面或在地图上显示相关位置
    // navigation.navigate('Map', { query: message.text, action: message.action });
  };

  const handleVoiceButtonPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const VoiceRecorder = () => (
    <TouchableOpacity
      style={styles.voiceButton}
      onPressIn={startRecording}
      onPressOut={stopRecording}
      activeOpacity={0.8}
      disabled={isProcessing && !isRecording}
    >
      {isRecording ? (
        <View style={styles.voiceContent}>
          <View style={styles.waveContainer}>
            <View style={[styles.wave, styles.wave1]} />
            <View style={[styles.wave, styles.wave2]} />
            <View style={[styles.wave, styles.wave3]} />
          </View>
          <Text style={styles.voiceText}>正在录音...</Text>
        </View>
      ) : (
        <Text style={styles.voiceText}>按住说话</Text>
      )}
    </TouchableOpacity>
  );

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
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onImagePress={handleImagePress}
        onVoicePress={handleVoicePress}
        onVoiceRecordStart={startRecording}
        onVoiceRecordEnd={stopRecording}
        disabled={isLoading || !selectedAction}
        isVoiceMode={inputMode === 'voice'}
        onToggleMode={toggleInputMode}
        isRecording={isRecording}
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
  voiceButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  wave: {
    width: 3,
    backgroundColor: theme.colors.white,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  wave1: {
    height: 12,
  },
  wave2: {
    height: 20,
  },
  wave3: {
    height: 16,
  },
  voiceText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AssistantScreen;
