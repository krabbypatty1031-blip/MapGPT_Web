import { useState, useCallback } from 'react';
import * as VoiceService from '../services/voiceService';

/**
 * 语音功能 Hook
 * 封装语音录音、识别的状态管理和逻辑
 */
export const useVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    if (isProcessing || isRecording) {
      console.log('录音正在进行中');
      return { success: false, error: '录音正在进行中' };
    }

    setIsProcessing(true);
    setIsRecording(true);

    const result = await VoiceService.startRecording();
    
    if (!result.success) {
      console.log('录音失败:', result.error);
      setIsRecording(false);
      setIsProcessing(false);
    }

    return result;
  }, [isProcessing, isRecording]);

  /**
   * 停止录音并识别
   * @param {string} selectedAction - 选中的快捷功能
   * @returns {Promise<Object>} 识别结果
   */
  const stopRecording = useCallback(async (selectedAction = null) => {
    if (!isRecording) {
      return { success: false, error: '没有正在进行的录音' };
    }

    setIsRecording(false);

    try {
      const result = await VoiceService.stopRecording();

      if (!result.success) {
        // 录音失败，返回 Mock 数据
        if (selectedAction) {
          const mockText = getMockTextByAction(selectedAction);
          return { success: true, text: mockText, isMock: true };
        }
        return { success: false, error: result.error };
      }

      // 录音成功，进行语音识别
      let recognizedText;
      
      if (selectedAction) {
        const voiceResult = await VoiceService.processVoiceWithAction(
          result.uri,
          selectedAction
        );
        recognizedText = voiceResult.text;
      } else {
        const sttResult = await VoiceService.speechToText(result.uri);
        recognizedText = sttResult.success ? sttResult.text : sttResult.mockText;
      }

      return {
        success: true,
        text: recognizedText,
        uri: result.uri,
      };
    } catch (error) {
      console.error('录音处理错误:', error);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording]);

  /**
   * 取消录音
   */
  const cancelRecording = useCallback(async () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsProcessing(false);

    await VoiceService.cancelRecording();
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};

/**
 * 根据 action 生成 Mock 文本
 */
const getMockTextByAction = (action) => {
  const mockTexts = {
    route: '从图书馆到食堂怎么走？',
    location: '最近的咖啡厅在哪里？',
    image: '这是什么建筑？',
    voice: '给我讲讲这个地方的历史。',
  };
  return mockTexts[action] || '你好，我想了解校园信息。';
};
