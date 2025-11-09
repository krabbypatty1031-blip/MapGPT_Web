/**
 * 语音服务（离线模式）
 * 负责录音、语音识别模拟以及本地 TTS 播放
 */

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getMockSpeechText } from './offlineData';

let recording = null;

const initAudioMode = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('初始化音频模式失败:', error);
  }
};

export const requestAudioPermission = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status === 'granted') {
      await initAudioMode();
      return true;
    }
    console.warn('录音权限被拒绝');
    return false;
  } catch (error) {
    console.error('请求录音权限失败:', error);
    return false;
  }
};

export const checkAudioPermission = async () => {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('检查录音权限失败:', error);
    return 'undetermined';
  }
};

export const startRecording = async (options = {}) => {
  try {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      return { success: false, error: '需要麦克风权限，请在设置中启用。' };
    }

    if (recording) {
      await stopRecording();
    }

    const recordingOptions = {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      ...options,
    };

    const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
    recording = newRecording;

    return {
      success: true,
      recording: newRecording,
    };
  } catch (error) {
    console.error('开始录音失败:', error);
    return { success: false, error: error.message || '录音启动失败' };
  }
};

export const stopRecording = async () => {
  try {
    if (!recording) {
      return { success: false, error: '没有正在进行的录音' };
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();

    const result = {
      success: true,
      uri,
      duration: status.durationMillis,
      size: status.metering,
    };

    recording = null;
    return result;
  } catch (error) {
    console.error('停止录音失败:', error);
    recording = null;
    return { success: false, error: error.message || '停止录音失败' };
  }
};

export const cancelRecording = async () => {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }
    return true;
  } catch (error) {
    console.error('取消录音失败:', error);
    recording = null;
    return false;
  }
};

export const getRecordingStatus = async () => {
  try {
    if (!recording) {
      return null;
    }
    return await recording.getStatusAsync();
  } catch (error) {
    console.error('获取录音状态失败:', error);
    return null;
  }
};

export const speechToText = async (_audioUri, options = {}) => {
  try {
    return {
      success: true,
      text: getMockSpeechText(options.actionType),
      confidence: 0.95,
      language: options.language || 'zh-CN',
      isMock: true,
    };
  } catch (error) {
    console.error('语音转文字失败:', error);
    return { success: false, error: error.message || '语音识别失败' };
  }
};

export const textToSpeech = async (text, options = {}) => {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: options.language || 'zh-CN',
      rate: options.speed || 1.0,
      pitch: 1.0,
      voice: options.voiceType === 'male' ? 'zh-cn-x-zh#male_1-local' : undefined,
    });
    return { success: true };
  } catch (error) {
    console.error('文字转语音失败:', error);
    return { success: false, error: error.message || '语音播放失败' };
  }
};

export const stopPlayback = async () => {
  try {
    Speech.stop();
    return true;
  } catch (error) {
    console.error('停止语音失败:', error);
    return false;
  }
};

export const processVoiceWithAction = async (audioUri, actionType, context = {}) => {
  try {
    const sttResult = await speechToText(audioUri, { actionType });
    if (!sttResult.success) {
      return { success: false, error: sttResult.error };
    }

    const actionMap = {
      route: { type: 'route', action: '正在为您规划路线...', icon: '🚶' },
      location: { type: 'location', action: '正在为您查找位置...', icon: '📍' },
      image: { type: 'image', action: '请拍摄相关图片...', icon: '📷' },
      voice: { type: 'voice', action: '正在为您讲解...', icon: '🔊' },
    };

    const actionInfo = actionMap[actionType] || { type: 'default', action: '正在处理...', icon: '💬' };

    return {
      success: true,
      text: sttResult.text,
      confidence: sttResult.confidence,
      ...actionInfo,
      context,
    };
  } catch (error) {
    console.error('处理语音失败:', error);
    return { success: false, error: error.message || '语音处理失败' };
  }
};

export const cleanup = async () => {
  try {
    await cancelRecording();
    await stopPlayback();
  } catch (error) {
    console.error('清理语音资源失败:', error);
  }
};

export default {
  requestAudioPermission,
  checkAudioPermission,
  startRecording,
  stopRecording,
  cancelRecording,
  getRecordingStatus,
  speechToText,
  textToSpeech,
  stopPlayback,
  processVoiceWithAction,
  cleanup,
};
