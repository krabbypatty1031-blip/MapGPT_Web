/**
 * 服务层统一入口（离线模式）
 * 模拟所有后端请求，保持与原有 API 结构一致
 */

import {
  analyzeImageOffline,
  buildChatReply,
  buildOfflineRoute,
  clearChatHistory,
  getBuildingFeatureCollection,
  getMockSpeechText,
  getPOIDetail,
  getRoadFeatureCollection,
  getNearestMarker,
  persistChatHistory,
  readChatHistory,
  searchPOIs,
  simulateLatency,
  uploadImageOffline,
} from './offlineData';

export const API_BASE_URL = 'offline://mapgpt';
export const API_TIMEOUT = 1000;

export const API_ENDPOINTS = {
  CHAT_SEND: '/api/chat',
  CHAT_HISTORY: '/api/chat/history',
  CHAT_SESSION: '/api/chat/session',
  SPEECH_TO_TEXT: '/api/voice/speech-to-text',
  TEXT_TO_SPEECH: '/api/voice/text-to-speech',
  IMAGE_UPLOAD: '/api/upload/image',
  IMAGE_ANALYSIS: '/api/vision/analyze',
  MAP_ROUTE: '/api/map/route',
  MAP_LOCATION: '/api/map/location',
  MAP_POI: '/api/map/poi',
  MAP_SEARCH: '/api/map/search',
  MAP_LAYERS_BUILDINGS: '/api/map/layers/buildings',
  MAP_LAYERS_ROADS: '/api/map/layers/roads',
};

const DEFAULT_SESSION = 'offline-session';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withLatency = (factory, delay) => simulateLatency(factory, delay);

export const apiRequest = async (endpoint) => {
  console.warn(`[API] 离线模式下未支持的请求: ${endpoint}`);
  return {
    success: false,
    error: '离线模式仅支持 services 内预置接口',
  };
};

export const ChatAPI = {
  sendMessage: async ({ message, sessionId = DEFAULT_SESSION, action, images = [], context = {} }) => {
    const payload = await withLatency(() => buildChatReply(message, action));

    persistChatHistory(sessionId, message, {
      text: payload.text,
      metadata: {
        action,
        images,
        context,
        locations: payload.locations,
      },
    });

    return {
      success: true,
      data: {
        sessionId,
        message: payload.text,
        suggestions: payload.suggestions,
        locations: payload.locations,
        createdAt: new Date().toISOString(),
      },
    };
  },

  getHistory: async (sessionId = DEFAULT_SESSION) => ({
    success: true,
    data: await withLatency(() => readChatHistory(sessionId)),
  }),

  deleteSession: async (sessionId = DEFAULT_SESSION) => {
    clearChatHistory(sessionId);
    return {
      success: true,
      data: { sessionId },
    };
  },
};

export const VoiceAPI = {
  speechToText: async ({ actionType }) =>
    withLatency(() => ({
      success: true,
      data: {
        text: getMockSpeechText(actionType),
        confidence: 0.92,
        language: 'zh-CN',
      },
    })),

  textToSpeech: async ({ text, voiceType = 'female', language = 'zh-CN' }) =>
    withLatency(() => ({
      success: true,
      data: {
        text,
        voiceType,
        language,
      },
    })),
};

export const ImageAPI = {
  uploadImage: async ({ uri, imageId, onProgress }) => {
    if (typeof onProgress === 'function') {
      for (let progress = 10; progress <= 100; progress += 30) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(progress * 4);
        onProgress(Math.min(progress, 100));
      }
    }

    const data = uploadImageOffline(uri, imageId);
    const payload = await withLatency(() => data, { min: 200, max: 380 });

    return {
      success: true,
      data: payload,
      ...payload,
    };
  },

  analyzeImage: async ({ analysisType = 'landmark' } = {}) =>
    withLatency(() => ({
      success: true,
      data: analyzeImageOffline(analysisType),
    })),
};

export const MapAPI = {
  getRoute: async ({ start, end }) =>
    withLatency(() => ({
      success: true,
      data: buildOfflineRoute(start, end),
    })),

  getBuildingLayers: async ({ bounds } = {}) =>
    withLatency(() => ({
      success: true,
      data: getBuildingFeatureCollection(bounds),
    })),

  getRoadLayers: async ({ bounds } = {}) =>
    withLatency(() => ({
      success: true,
      data: getRoadFeatureCollection(bounds),
    })),

  getLocation: async ({ lat, lng }) =>
    withLatency(() => ({
      success: true,
      data: getNearestMarker({ latitude: lat, longitude: lng }),
    })),

  searchPOI: async ({ keyword, category }) =>
    withLatency(() => ({
      success: true,
      data: searchPOIs({ keyword, category }),
    })),

  getPOIDetail: async (poiId) =>
    withLatency(() => ({
      success: true,
      data: getPOIDetail(poiId),
    })),
};

export default {
  ChatAPI,
  VoiceAPI,
  ImageAPI,
  MapAPI,
  apiRequest,
};
