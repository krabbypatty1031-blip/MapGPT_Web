/**
 * 对话服务
 * 处理聊天业务逻辑和Mock数据生成
 * API调用已迁移至 api.js
 */

import { ChatAPI } from './api';

/**
 * 发送消息到AI助手
 * @param {string} message - 用户消息
 * @param {string} sessionId - 会话ID（可选）
 * @param {Object} context - 上下文信息（可选）
 * @returns {Promise<Object>} AI响应
 */
export const sendMessage = async (message, sessionId = null, context = {}) => {
  try {
    const result = await ChatAPI.sendMessage({
      message,
      sessionId,
      context,
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 在开发环境返回模拟数据
    if (__DEV__) {
      return {
        success: true,
        data: generateMockResponse(message),
        isMock: true,
      };
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 生成模拟响应（开发阶段使用）
 * @param {string} message - 用户消息
 * @returns {Object} 模拟响应
 */
const generateMockResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const mockResponses = {
    '图书馆': {
      message: '📚 香港浸会大学图书馆\n\n开放时间：\n周一至周五：8:00 AM - 10:00 PM\n周六至周日：9:00 AM - 6:00 PM\n\n位置：教学楼B座2-5层\n\n提供服务：\n• 图书借阅\n• 自习座位\n• 电脑设备\n• 打印复印',
      suggestions: ['查看馆藏资源', '预约座位', '查询借阅记录'],
    },
    '路线': {
      message: '🚶 校园导航\n\n从学生会到教学楼A座：\n1. 从学生会出发向北走\n2. 经过中央广场\n3. 穿过林荫道\n4. 到达教学楼A座南门\n\n预计步行时间：5分钟\n距离：约300米',
      suggestions: ['查看地图', '其他路线', '附近设施'],
    },
    '食堂': {
      message: '🍽️ 校园餐饮指南\n\n推荐食堂：\n\n1. 南翼食堂\n   • 中式快餐\n   • 营业时间：7:00-20:00\n   • 人均消费：¥25\n\n2. 北翼食堂\n   • 西式简餐\n   • 营业时间：7:00-21:00\n   • 人均消费：¥30\n\n3. 咖啡厅\n   • 轻食饮品\n   • 营业时间：8:00-22:00\n   • 人均消费：¥35',
      suggestions: ['今日菜单', '营养搭配', '附近餐厅'],
    },
    '活动': {
      message: '🎉 本周校园活动\n\n周一 (10/28)：学术讲座\n时间：19:00\n地点：大礼堂\n\n周三 (10/30)：社团招新\n时间：14:00-17:00\n地点：中央广场\n\n周五 (11/1)：篮球赛\n时间：16:00\n地点：体育馆',
      suggestions: ['报名活动', '查看更多', '活动日历'],
    },
  };

  // 匹配关键词
  for (const [key, value] of Object.entries(mockResponses)) {
    if (lowerMessage.includes(key)) {
      return {
        message: value.message,
        suggestions: value.suggestions,
        timestamp: new Date().toISOString(),
        type: 'text',
      };
    }
  }

  // 默认响应
  return {
    message: '👋 你好！我是香港浸会大学智能助手MapGPT。\n\n我可以帮你：\n• 🗺️ 校园导航和路线规划\n• 📚 查询图书馆信息\n• 🍽️ 推荐校园美食\n• 🎓 了解校园活动\n• ℹ️ 获取各类校园资讯\n\n请问有什么可以帮到你的？',
    suggestions: ['图书馆开放时间', '查看地图', '食堂推荐', '本周活动'],
    timestamp: new Date().toISOString(),
    type: 'text',
  };
};

/**
 * 获取预设问题列表
 * @returns {Array<Object>} 预设问题列表
 */
export const getPresetQuestions = () => {
  return [
    {
      id: '1',
      icon: '📚',
      title: '图书馆查询',
      text: '查询香港浸会大学图书馆开放时间',
      query: '图书馆开放时间',
      category: 'library',
    },
    {
      id: '2',
      icon: '🚶',
      title: '路线导航',
      text: '从学生会到教学楼A座的路线',
      query: '学生会到教学楼A座路线',
      category: 'navigation',
    },
    {
      id: '3',
      icon: '📖',
      title: '资源导览',
      text: '图书馆资源导览',
      query: '图书馆资源',
      category: 'library',
    },
    {
      id: '4',
      icon: '🍽️',
      title: '美食推荐',
      text: '校园美食推荐',
      query: '食堂推荐',
      category: 'dining',
    },
    {
      id: '5',
      icon: '🏃',
      title: '校园活动',
      text: '本周校园活动',
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
};

/**
 * 获取会话历史
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Array>} 消息历史
 */
export const getChatHistory = async (sessionId) => {
  try {
    const result = await ChatAPI.getHistory(sessionId);
    return {
      success: true,
      data: result,
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

/**
 * 清除会话
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 操作结果
 */
export const clearChatSession = async (sessionId) => {
  try {
    await ChatAPI.deleteSession(sessionId);
    return {
      success: true,
    };
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
