/**
 * 对话服务（离线模式）
 * 负责模拟流式响应、预设问题与历史记录的封装
 */

import { ChatAPI } from './api';
import { ROUTE_LOCATIONS } from './offlineData';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const streamDelay = () => 60 + Math.random() * 90;

const splitContentIntoChunks = (text = '') => {
  if (!text) return [];
  const sentences = text.split(/(?<=[。！？!?\n])/);
  const chunks = [];
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.length <= 28) {
      chunks.push(trimmed);
      return;
    }
    for (let i = 0; i < trimmed.length; i += 28) {
      chunks.push(trimmed.slice(i, i + 28));
    }
  });
  return chunks.length ? chunks : [text];
};

const streamAssistantResponse = async ({ text, suggestions = [], locations, onChunk, onComplete }) => {
  const chunks = splitContentIntoChunks(text);

  for (const chunk of chunks) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(streamDelay());
    onChunk?.({ content: chunk });
  }

  await sleep(50);
  onChunk?.({
    done: true,
    suggestions,
    locations,
  });
  onComplete?.();
};

export const sendMessage = async (
  message,
  sessionId = null,
  action = null,
  images = [],
  context = {},
  onChunk,
  onComplete,
  onError,
) => {
  console.log('[chatService] sendMessage:', {
    messageLength: message?.length,
    sessionId,
    action,
    imageCount: images?.length,
    hasContext: !!Object.keys(context || {}).length,
  });

  try {
    const response = await ChatAPI.sendMessage({
      message,
      sessionId: sessionId || undefined,
      action,
      images,
      context,
    });

    if (!response.success) {
      throw new Error(response.error || '离线聊天失败');
    }

    const { message: aiText, suggestions, locations } = response.data || {};
    await streamAssistantResponse({
      text: aiText,
      suggestions,
      locations,
      onChunk,
      onComplete,
    });
  } catch (error) {
    console.error('[chatService] sendMessage fallback:', error);
    const fallback = generateMockResponse(message);
    await streamAssistantResponse({
      text: fallback.message,
      suggestions: fallback.suggestions,
      locations: action === 'route' ? ROUTE_LOCATIONS : undefined,
      onChunk,
      onComplete,
    });
    onError?.(error);
  }
};

const generateMockResponse = (message = '') => {
  const lowerMessage = message.toLowerCase();

  const mockResponses = {
    library: {
      keywords: ['图书', 'library', 'book'],
      message:
        '📚 香港浸会大学图书馆今日开放 08:00-22:00，提供自习室、研讨室与打印服务，可提前预约座位。',
      suggestions: ['查看馆藏', '学习空间', '预约研讨室'],
    },
    route: {
      keywords: ['路线', '导航', '怎么走', 'route'],
      message:
        '🚶 校园导航：从学生会出发沿中央广场前行，穿过林荫道即可抵达教学楼A座，全程约 6 分钟。',
      suggestions: ['查看地图', '替换终点', '附近设施'],
    },
    dining: {
      keywords: ['食堂', '餐厅', '吃', 'dining'],
      message:
        '🍽 今日推荐南翼食堂的健康套餐与北翼食堂的轻食咖啡，午市 11:00-14:30，支持移动取餐。',
      suggestions: ['今日菜单', '排队情况', '附近咖啡'],
    },
    events: {
      keywords: ['活动', 'event', '讲座'],
      message:
        '🎉 本周活动：周三社团招新@中央广场、周五原创音乐会@大礼堂，均可在App内预约。',
      suggestions: ['报名方式', '更多活动', '提醒我'],
    },
  };

  for (const value of Object.values(mockResponses)) {
    if (value.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return {
        message: value.message,
        suggestions: value.suggestions,
      };
    }
  }

  return {
    message:
      '👋 你好！我是 MapGPT 校园助手，可提供路线规划、图书馆信息、校园活动与生活指南。请告诉我想了解的内容。',
    suggestions: ['校内路线', '图书馆开放', '附近餐饮', '本周活动'],
  };
};

export const getPresetQuestions = () => [
  {
    id: '1',
    icon: '📚',
    title: '图书馆查询',
    text: '图书馆开放时间',
    query: '图书馆开放时间',
    category: 'library',
  },
  {
    id: '2',
    icon: '🚶',
    title: '路线导航',
    text: '从学生会到教学楼A座怎么走',
    query: '学生会到教学楼A座路线',
    category: 'navigation',
  },
  {
    id: '3',
    icon: '📖',
    title: '资源导览',
    text: '图书馆资源介绍',
    query: '图书馆资源',
    category: 'library',
  },
  {
    id: '4',
    icon: '🍽',
    title: '美食推荐',
    text: '校园美食推荐',
    query: '食堂推荐',
    category: 'dining',
  },
  {
    id: '5',
    icon: '🏃',
    title: '校园活动',
    text: '本周校园活动安排',
    query: '本周活动',
    category: 'events',
  },
  {
    id: '6',
    icon: '🏢',
    title: '建筑查询',
    text: '查找校园建筑位置',
    query: '教学楼位置',
    category: 'buildings',
  },
];

export const getChatHistory = async (sessionId) => {
  try {
    const result = await ChatAPI.getHistory(sessionId);
    if (!result.success) {
      throw new Error(result.error || '历史记录获取失败');
    }
    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

export const clearChatSession = async (sessionId) => {
  try {
    const result = await ChatAPI.deleteSession(sessionId);
    if (!result.success) {
      throw new Error(result.error || '会话清理失败');
    }
    return { success: true };
  } catch (error) {
    console.error('清除会话失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendMessage,
  getPresetQuestions,
  getChatHistory,
  clearChatSession,
};
