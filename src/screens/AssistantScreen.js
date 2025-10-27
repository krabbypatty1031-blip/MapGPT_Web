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

  const handleVoiceInput = async (recognizedText) => {
    if (recognizedText) {
      await sendMessage(recognizedText);
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'text' ? 'voice' : 'text');
    setIsRecording(false);
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
          <MessageList messages={messages} isLoading={isLoading} />
        ) : (
          <PresetQuestions onSelectQuestion={sendMessage} />
        )}
      </ScrollView>

      <QuickActions
        selectedAction={selectedAction}
        onSelectAction={setSelectedAction}
      />

      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading}
        isVoiceMode={inputMode === 'voice'}
        onToggleMode={toggleInputMode}
        voiceComponent={<VoiceRecorder />}
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
