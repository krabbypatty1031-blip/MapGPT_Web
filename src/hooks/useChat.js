import { useState, useCallback } from 'react';
import { sendMessage as sendMessageAPI } from '../services/chatService';

/**
 * 聊天功能 Hook
 * 封装消息管理和API调用逻辑
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text, action = null) => {
    if (!text || !text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
      action, // 保存用户选择的功能类型
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessageAPI(text.trim());
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: response.data?.message || response.mockResponse?.message || '抱歉，我现在无法回答。',
        timestamp: new Date(),
        action, // AI回复也保存对应的功能类型
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: '抱歉，发生了一些错误。请稍后再试。',
        timestamp: new Date(),
        action,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
