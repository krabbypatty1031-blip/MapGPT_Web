/**
 * 语音服务
 * 处理语音录音、识别、播放和转换
 */

import { Audio } from 'expo-av';

// API配置
const VOICE_API_CONFIG = {
  baseURL: process.env.VOICE_API_URL || 'https://your-voice-api-endpoint.com',
  timeout: 30000,
};

// 全局录音对象
let recording = null;
let sound = null;

/**
 * 初始化音频模式
 */
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

/**
 * 请求录音权限
 * @returns {Promise<boolean>} 是否获得权限
 */
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

/**
 * 检查录音权限状态
 * @returns {Promise<string>} 权限状态
 */
export const checkAudioPermission = async () => {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('检查录音权限失败:', error);
    return 'undetermined';
  }
};

/**
 * 开始录音
 * @param {Object} options - 录音选项
 * @returns {Promise<Object>} 录音对象和状态
 */
export const startRecording = async (options = {}) => {
  try {
    // 检查权限
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '没有录音权限，请在设置中允许访问麦克风',
      };
    }

    // 停止之前的录音
    if (recording) {
      await stopRecording();
    }

    // 配置录音选项
    const recordingOptions = {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      ...options,
    };

    // 创建录音对象
    const { recording: newRecording } = await Audio.Recording.createAsync(
      recordingOptions
    );

    recording = newRecording;

    return {
      success: true,
      recording: newRecording,
    };
  } catch (error) {
    console.error('开始录音失败:', error);
    return {
      success: false,
      error: error.message || '录音启动失败',
    };
  }
};

/**
 * 停止录音
 * @returns {Promise<Object>} 录音URI、时长和状态
 */
export const stopRecording = async () => {
  try {
    if (!recording) {
      return {
        success: false,
        error: '没有正在进行的录音',
      };
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
    return {
      success: false,
      error: error.message || '停止录音失败',
    };
  }
};

/**
 * 取消录音
 * @returns {Promise<boolean>} 操作结果
 */
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

/**
 * 获取录音状态
 * @returns {Promise<Object|null>} 录音状态
 */
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

/**
 * 将语音转换为文字
 * @param {string} audioUri - 音频文件URI
 * @param {Object} options - 识别选项
 * @returns {Promise<Object>} 识别结果
 */
export const speechToText = async (audioUri, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });

    // 添加额外参数
    if (options.language) {
      formData.append('language', options.language);
    }
    if (options.actionType) {
      formData.append('actionType', options.actionType);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VOICE_API_CONFIG.timeout);

    const response = await fetch(`${VOICE_API_CONFIG.baseURL}/speech-to-text`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`语音识别API错误: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      text: data.text,
      confidence: data.confidence || 0,
      language: data.language,
    };
  } catch (error) {
    console.error('语音转文字失败:', error);
    
    // 开发环境返回模拟数据
    if (__DEV__) {
      return {
        success: true,
        text: getMockRecognitionText(options.actionType),
        confidence: 0.95,
        isMock: true,
      };
    }
    
    return {
      success: false,
      error: error.message || '语音识别失败',
    };
  }
};

/**
 * 生成模拟识别文本（开发阶段使用）
 * @param {string} actionType - 快捷功能类型
 * @returns {string} 模拟文本
 */
const getMockRecognitionText = (actionType) => {
  const mockTexts = {
    route: '从图书馆到食堂怎么走？',
    location: '最近的咖啡厅在哪里？',
    image: '这是什么建筑？',
    voice: '给我讲讲这个地方的历史',
    default: '你好，我想了解一下校园信息',
  };

  return mockTexts[actionType] || mockTexts.default;
};

/**
 * 文字转语音并播放
 * @param {string} text - 要转换的文字
 * @param {Object} options - 语音选项
 * @returns {Promise<Object>} 播放结果
 */
export const textToSpeech = async (text, options = {}) => {
  try {
    // 停止之前的播放
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }

    const response = await fetch(`${VOICE_API_CONFIG.baseURL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceType: options.voiceType || 'female',
        language: options.language || 'zh-CN',
        speed: options.speed || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('文字转语音失败');
    }

    const data = await response.json();
    
    // 播放音频
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: data.audioUrl },
      { shouldPlay: true }
    );

    sound = newSound;

    return {
      success: true,
      sound: newSound,
    };
  } catch (error) {
    console.error('文字转语音失败:', error);
    return {
      success: false,
      error: error.message || '语音播放失败',
    };
  }
};

/**
 * 停止语音播放
 * @returns {Promise<boolean>} 操作结果
 */
export const stopPlayback = async () => {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
    return true;
  } catch (error) {
    console.error('停止播放失败:', error);
    return false;
  }
};

/**
 * 处理带有上下文的语音输入
 * @param {string} audioUri - 音频URI
 * @param {string} actionType - 功能类型
 * @param {Object} context - 上下文信息
 * @returns {Promise<Object>} 处理结果
 */
export const processVoiceWithAction = async (audioUri, actionType, context = {}) => {
  try {
    // 语音识别
    const sttResult = await speechToText(audioUri, { actionType });
    
    if (!sttResult.success) {
      return {
        success: false,
        error: sttResult.error,
      };
    }

    const text = sttResult.text;
    const actionMap = {
      route: {
        type: 'route',
        action: '正在为您规划路线...',
        icon: '🚶',
      },
      location: {
        type: 'location',
        action: '正在为您查找位置...',
        icon: '📍',
      },
      image: {
        type: 'image',
        action: '请拍摄照片...',
        icon: '📷',
      },
      voice: {
        type: 'voice',
        action: '正在为您讲解...',
        icon: '🔊',
      },
    };

    const actionInfo = actionMap[actionType] || {
      type: 'default',
      action: '正在处理您的请求...',
      icon: '💬',
    };

    console.log(`处理${actionInfo.type}语音:`, text);

    return {
      success: true,
      text,
      confidence: sttResult.confidence,
      ...actionInfo,
      context,
    };
  } catch (error) {
    console.error('处理语音失败:', error);
    return {
      success: false,
      error: error.message || '语音处理失败',
    };
  }
};

/**
 * 清理所有音频资源
 * @returns {Promise<void>}
 */
export const cleanup = async () => {
  try {
    await cancelRecording();
    await stopPlayback();
  } catch (error) {
    console.error('清理音频资源失败:', error);
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
