/**
 * Web 端语音服务
 * 使用浏览器 SpeechRecognition 和 SpeechSynthesis API
 */

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

let recognitionInstance = null;
let recognitionPromise = null;
let resolveRecognition = null;
let rejectRecognition = null;
let lastTranscript = '';

/**
 * 检查浏览器是否支持语音识别
 * @returns {boolean} 是否支持
 */
const isRecognitionSupported = () => Boolean(getSpeechRecognitionCtor());

/**
 * 请求语音权限（Web Speech 无显式权限，只检查支持性）
 * @returns {Promise<boolean>} 是否可用
 */
export const requestAudioPermission = async () => isRecognitionSupported();

/**
 * 检查语音权限
 * @returns {Promise<string>} 权限状态
 */
export const checkAudioPermission = async () => (isRecognitionSupported() ? 'granted' : 'denied');

/**
 * 开始语音录制/识别
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const startRecording = async () => {
  const SpeechRecognition = getSpeechRecognitionCtor();

  if (!SpeechRecognition) {
    return {
      success: false,
      error: '当前浏览器暂不支持语音识别功能',
    };
  }

  if (recognitionInstance) {
    recognitionInstance.stop();
    recognitionInstance = null;
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = 'zh-CN';
  recognitionInstance.interimResults = false;
  recognitionInstance.continuous = false;
  lastTranscript = '';

  recognitionPromise = new Promise((resolve, reject) => {
    resolveRecognition = resolve;
    rejectRecognition = reject;
  });

  recognitionInstance.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || '')
      .join(' ')
      .trim();

    lastTranscript = transcript;
    resolveRecognition?.({
      transcript,
      confidence: event.results?.[0]?.[0]?.confidence ?? 0,
    });
  };

  recognitionInstance.onerror = (event) => {
    const errorMessage = event?.error || event?.message || '语音识别发生错误';
    rejectRecognition?.(new Error(errorMessage));
  };

  recognitionInstance.onend = () => {
    if (recognitionInstance) {
      recognitionInstance = null;
    }
    if (resolveRecognition && !lastTranscript) {
      resolveRecognition({ transcript: '', confidence: 0 });
    }
  };

  try {
    recognitionInstance.start();
    return { success: true };
  } catch (error) {
    recognitionInstance = null;
    resolveRecognition = null;
    rejectRecognition = null;
    recognitionPromise = null;
    return {
      success: false,
      error: error?.message || '语音识别启动失败',
    };
  }
};

/**
 * 停止语音录制并返回识别结果
 * @returns {Promise<{success: boolean, text?: string, uri: null, confidence?: number, error?: string}>}
 */
export const stopRecording = async () => {
  if (!recognitionPromise) {
    return {
      success: false,
      error: '没有正在进行的语音识别',
    };
  }

  try {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }

    const result = await recognitionPromise;
    recognitionInstance = null;
    recognitionPromise = null;
    resolveRecognition = null;
    rejectRecognition = null;

    if (!result?.transcript) {
      return {
        success: false,
        error: '未捕获到语音内容',
      };
    }

    return {
      success: true,
      text: result.transcript,
      uri: null,
      confidence: result?.confidence ?? 0,
    };
  } catch (error) {
    recognitionInstance = null;
    recognitionPromise = null;
    resolveRecognition = null;
    rejectRecognition = null;
    return {
      success: false,
      error: error?.message || '语音识别失败',
    };
  }
};

/**
 * 取消当前语音识别
 * @returns {Promise<boolean>} 是否成功取消
 */
export const cancelRecording = async () => {
  if (!recognitionInstance) {
    return true;
  }
  try {
    recognitionInstance.abort();
  } catch (error) {
    console.warn('[voiceService.web] 取消识别失败:', error);
  }
  recognitionInstance = null;
  recognitionPromise = null;
  resolveRecognition = null;
  rejectRecognition = null;
  return true;
};

/**
 * 获取录音状态
 * @returns {Promise<{isRecording: boolean}>}
 */
export const getRecordingStatus = async () => ({
  isRecording: Boolean(recognitionInstance),
});

/**
 * 语音识别到文本（直接返回缓存结果）
 * @returns {Promise<{success: boolean, text: string, isMock: boolean}>}
 */
export const speechToText = async () => {
  if (!lastTranscript) {
    return {
      success: false,
      error: '暂未捕获语音内容',
    };
  }
  return {
    success: true,
    text: lastTranscript,
    isMock: false,
  };
};

/**
 * 根据快捷功能类型处理语音（复用识别结果）
 * @param {null} _ignoredUri 未使用的音频 URI
 * @param {string} actionType 功能类型
 * @returns {Promise<Object>} 处理后的语音信息
 */
export const processVoiceWithAction = async (_ignoredUri, actionType) => {
  const result = await speechToText();
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

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
      action: '请上传相关图片...',
      icon: '📷',
    },
    voice: {
      type: 'voice',
      action: '正在为您讲解...',
      icon: '🔊',
    },
  };

  const fallback = {
    type: 'default',
    action: '处理中...',
    icon: '💬',
  };

  return {
    success: true,
    text: result.text,
    confidence: 0.9,
    ...(actionMap[actionType] || fallback),
  };
};

let activeUtterance = null;

/**
 * 文本转语音播放
 * @param {string} text 文本内容
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const textToSpeech = async (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return {
      success: false,
      error: '当前浏览器不支持语音播放',
    };
  }

  try {
    if (activeUtterance) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    activeUtterance = utterance;

    window.speechSynthesis.speak(utterance);
    return { success: true };
  } catch (error) {
    console.warn('[voiceService.web] 语音播放失败:', error);
    return {
      success: false,
      error: error?.message || '语音播放失败',
    };
  }
};

/**
 * 停止语音播放
 * @returns {Promise<boolean>} 是否成功停止
 */
export const stopPlayback = async () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }
  window.speechSynthesis.cancel();
  activeUtterance = null;
  return true;
};

/**
 * 清理资源
 * @returns {Promise<void>}
 */
export const cleanup = async () => {
  await cancelRecording();
  await stopPlayback();
};

export default {
  requestAudioPermission,
  checkAudioPermission,
  startRecording,
  stopRecording,
  cancelRecording,
  getRecordingStatus,
  speechToText,
  processVoiceWithAction,
  textToSpeech,
  stopPlayback,
  cleanup,
};


