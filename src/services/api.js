/**
 * API 服务统一配置
 * 集中管理所有后端接口调用
 */

// API基础配置
// export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
export const API_BASE_URL = 'http://10.0.2.2:8787';
export const API_TIMEOUT = 30000;

// API端点定义
export const API_ENDPOINTS = {
  // 聊天相关
  CHAT_SEND: '/api/chat',
  CHAT_HISTORY: '/api/chat/history',
  CHAT_SESSION: '/api/chat/session',
  
  // 语音相关
  SPEECH_TO_TEXT: '/api/voice/speech-to-text',
  TEXT_TO_SPEECH: '/api/voice/text-to-speech',
  
  // 图片相关
  IMAGE_UPLOAD: '/api/upload/image',
  IMAGE_ANALYSIS: '/api/vision/analyze',
  
  // 地图相关
  MAP_ROUTE: '/api/map/route',
  MAP_LOCATION: '/api/map/location',
  MAP_POI: '/api/map/poi',
  MAP_SEARCH: '/api/map/search',
};

/**
 * 通用请求函数
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = API_TIMEOUT,
    ...otherOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 检测是否为 FormData 或 Blob（文件上传场景）
    const isFormData = body && typeof body.append === 'function';
    const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
      ...otherOptions,
    };

    // 对于 FormData/Blob，删除 Content-Type 让运行时自动设置 boundary
    if (isFormData || isBlob) {
      delete config.headers['Content-Type'];
    }

    if (body && method !== 'GET') {
      if (isFormData || isBlob) {
        // 直接传递 FormData/Blob，不做任何转换
        config.body = body;
      } else if (typeof body === 'string') {
        config.body = body;
      } else {
        // 普通对象转 JSON
        config.body = JSON.stringify(body);
      }
    }

    console.log(`[API] 请求: ${method} ${endpoint}`, {
      isFormData,
      isBlob,
      hasBody: !!body,
      headers: config.headers,
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 尝试读取错误响应体
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.text();
        console.error(`[API] 错误响应体: ${errorBody}`);
        errorDetail = errorBody || errorDetail;
      } catch (e) {
        console.error(`[API] 无法读取错误响应体:`, e);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorDetail}`);
    }

    const data = await response.json();
    console.log(`[API] 响应成功:`, data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API请求失败 [${method} ${endpoint}]:`, error);
    
    return {
      success: false,
      error: error.message || 'Network request failed',
    };
  }
};

/**
 * 聊天API
 */
export const ChatAPI = {
  /**
   * 发送消息
   * @param {Object} params - 请求参数
   * @param {string} params.message - 用户消息
   * @param {string} params.sessionId - 会话ID
   * @param {string} params.action - 快捷功能类型 (route/location/image/voice)
   * @param {Array} params.images - 图片数组
   * @param {Object} params.context - 上下文信息
   * @returns {Promise<Object>}
   */
  sendMessage: async ({ message, sessionId, action, images = [], context = {} }) => {
    console.log('[ChatAPI] sendMessage 调用:', {
      message,
      sessionId,
      action,
      images,
      context,
    });
    return request(API_ENDPOINTS.CHAT_SEND, {
      method: 'POST',
      body: {
        message,
        sessionId,
        action,
        images: images.map(img => ({ id: img.id, url: img.url })),
        context,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * 获取聊天历史
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>}
   */
  getHistory: async (sessionId) => {
    return request(`${API_ENDPOINTS.CHAT_HISTORY}/${sessionId}`, {
      method: 'GET',
    });
  },

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>}
   */
  deleteSession: async (sessionId) => {
    return request(`${API_ENDPOINTS.CHAT_SESSION}/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * 语音API
 */
export const VoiceAPI = {
  /**
   * 语音转文字
   * @param {Object} params - 请求参数
   * @param {string} params.audioUri - 音频文件URI
   * @param {string} params.language - 语言代码 (zh-CN/en-US)
   * @param {string} params.actionType - 功能类型
   * @returns {Promise<Object>}
   */
  speechToText: async ({ audioUri, language = 'zh-CN', actionType }) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });
    formData.append('language', language);
    if (actionType) {
      formData.append('actionType', actionType);
    }

    return request(API_ENDPOINTS.SPEECH_TO_TEXT, {
      method: 'POST',
      // 不要手动设置 Content-Type，让 fetch 自动设置 multipart/form-data 的 boundary
      body: formData,
    });
  },

  /**
   * 文字转语音
   * @param {Object} params - 请求参数
   * @param {string} params.text - 要转换的文字
   * @param {string} params.voiceType - 音色类型 (male/female)
   * @param {string} params.language - 语言代码
   * @param {number} params.speed - 语速 (0.5-2.0)
   * @returns {Promise<Object>}
   */
  textToSpeech: async ({ text, voiceType = 'female', language = 'zh-CN', speed = 1.0 }) => {
    return request(API_ENDPOINTS.TEXT_TO_SPEECH, {
      method: 'POST',
      body: {
        text,
        voiceType,
        language,
        speed,
      },
    });
  },
};

/**
 * 图片API
 */
export const ImageAPI = {
  /**
   * 上传图片
   * @param {Object} params - 请求参数
   * @param {string} params.uri - 图片URI
   * @param {string} params.imageId - 图片ID
   * @param {Function} params.onProgress - 进度回调
   * @returns {Promise<Object>}
   */
  uploadImage: async ({ uri, imageId, onProgress }) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `image_${imageId}.jpg`,
    });

    console.log('[ImageAPI] uploadImage 调用:', { uri, imageId, hasProgress: !!onProgress });

    // 如果需要上传进度，使用XMLHttpRequest
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          console.log('[ImageAPI XHR] 响应状态:', xhr.status);
          console.log('[ImageAPI XHR] 响应文本:', xhr.responseText);
          
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ success: true, data });
            } catch (error) {
              console.error('[ImageAPI XHR] JSON 解析失败:', error);
              reject({ success: false, error: 'Invalid response' });
            }
          } else {
            // 尝试解析错误响应
            let errorMsg = `HTTP ${xhr.status}`;
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMsg = errorData.message || errorMsg;
            } catch (e) {
              errorMsg = xhr.responseText || errorMsg;
            }
            console.error('[ImageAPI XHR] 请求失败:', errorMsg);
            reject({ success: false, error: errorMsg });
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('[ImageAPI XHR] 网络错误:', e);
          reject({ success: false, error: 'Upload failed' });
        });

        xhr.open('POST', `${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`);
        
        // 关键修复：不要设置 Content-Type header
        // XMLHttpRequest 会自动为 FormData 设置正确的 Content-Type（包含 boundary）
        // xhr.setRequestHeader('Content-Type', 'multipart/form-data'); // ❌ 删除这行
        
        console.log('[ImageAPI XHR] 发送请求到:', `${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`);
        xhr.send(formData);
      });
    }

    return request(API_ENDPOINTS.IMAGE_UPLOAD, {
      method: 'POST',
      // 不要手动设置 Content-Type，让 fetch 自动设置 multipart/form-data 的 boundary
      body: formData,
    });
  },

  /**
   * 图片分析
   * @param {Object} params - 请求参数
   * @param {string} params.imageUrl - 图片URL
   * @param {string} params.analysisType - 分析类型 (ocr/landmark/object)
   * @returns {Promise<Object>}
   */
  analyzeImage: async ({ imageUrl, analysisType = 'landmark' }) => {
    return request(API_ENDPOINTS.IMAGE_ANALYSIS, {
      method: 'POST',
      body: {
        imageUrl,
        analysisType,
      },
    });
  },
};

/**
 * 地图API
 */
export const MapAPI = {
  /**
   * 路线规划
   * @param {Object} params - 请求参数
   * @param {Object} params.start - 起点 {lat, lng, name}
   * @param {Object} params.end - 终点 {lat, lng, name}
   * @param {string} params.mode - 出行方式 (walking/driving/transit)
   * @returns {Promise<Object>}
   */
  getRoute: async ({ start, end, mode = 'walking' }) => {
    return request(API_ENDPOINTS.MAP_ROUTE, {
      method: 'POST',
      body: {
        start,
        end,
        mode,
      },
    });
  },

  /**
   * 获取位置信息
   * @param {Object} params - 请求参数
   * @param {number} params.lat - 纬度
   * @param {number} params.lng - 经度
   * @returns {Promise<Object>}
   */
  getLocation: async ({ lat, lng }) => {
    return request(`${API_ENDPOINTS.MAP_LOCATION}?lat=${lat}&lng=${lng}`, {
      method: 'GET',
    });
  },

  /**
   * 搜索POI
   * @param {Object} params - 请求参数
   * @param {string} params.keyword - 搜索关键词
   * @param {Object} params.location - 当前位置 {lat, lng}
   * @param {number} params.radius - 搜索半径（米）
   * @param {string} params.category - POI类别
   * @returns {Promise<Object>}
   */
  searchPOI: async ({ keyword, location, radius = 1000, category }) => {
    return request(API_ENDPOINTS.MAP_SEARCH, {
      method: 'POST',
      body: {
        keyword,
        location,
        radius,
        category,
      },
    });
  },

  /**
   * 获取POI详情
   * @param {string} poiId - POI ID
   * @returns {Promise<Object>}
   */
  getPOIDetail: async (poiId) => {
    return request(`${API_ENDPOINTS.MAP_POI}/${poiId}`, {
      method: 'GET',
    });
  },
};

export default {
  ChatAPI,
  VoiceAPI,
  ImageAPI,
  MapAPI,
};
