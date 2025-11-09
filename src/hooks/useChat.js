import { useState, useCallback, useRef } from 'react';
import { sendMessage as sendMessageAPI } from '../services/chatService';

/**
 * 聊天功能 Hook
 * 封装消息管理和API调用逻辑
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const accumulatedTextRef = useRef(''); // 使用 ref 存储累积文本

  const sendMessage = useCallback(async (text, action = null, images = []) => {
    console.log('[useChat] sendMessage 调用:', { text, action, images });
    if (!text || !text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
      action, // 保存用户选择的功能类型
      images: images.map(img => ({ id: img.id, url: img.url || img.uri })), // 保存图片信息
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      accumulatedTextRef.current = ''; // 重置累积文本
      let updateCount = 0;
      let aiMessageId = null;
      let hasReceivedContent = false; // 标记是否已经收到过内容

      await sendMessageAPI(
        text.trim(),
        null,
        action,
        images,
        {}, // context
        // onChunk 回调
        (chunk) => {
          // console.log('[useChat] 收到数据块:', chunk);
          
          // 处理 route action 的特殊响应
          if (action === 'route' && chunk.done && Array.isArray(chunk.locations)) {
            console.log('[useChat] 收到 route locations:', chunk.locations);
            // 在完成时更新消息，添加 locations 信息
            if (aiMessageId) {
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                  ? { 
                      ...msg, 
                      isStreaming: false, 
                      text: accumulatedTextRef.current,
                      locations: chunk.locations // 添加地点信息
                    }
                  : msg
              ));
            }
            return;
          }

          if (chunk.content) {
            let contentToAdd = chunk.content;
            
            // 如果是第一次收到内容，过滤掉开头的空行
            if (!hasReceivedContent) {
              contentToAdd = contentToAdd.trimStart();
              if (contentToAdd) {
                hasReceivedContent = true;
              }
            }
            
            if (contentToAdd || hasReceivedContent) {
              accumulatedTextRef.current += contentToAdd;
              updateCount++;
              
              // console.log(`[useChat] 更新文本 (${updateCount}):`, accumulatedTextRef.current);
              
              // 第一次收到内容时，创建AI消息并设置 isLoading 为 false
              if (updateCount === 1) {
                aiMessageId = (Date.now() + 1).toString();
                const aiMessage = {
                  id: aiMessageId,
                  type: 'ai',
                  text: accumulatedTextRef.current,
                  timestamp: new Date(),
                  action, // AI回复也保存对应的功能类型
                  isStreaming: true, // 标记为流式响应中
                  messageId: aiMessageId, // 用于匹配
                };
                
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
              } else {
                // 直接更新消息文本
                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: accumulatedTextRef.current }
                    : msg
                ));
              }
            }
          }
        },
        // onComplete 回调
        () => {
          console.log('[useChat] 消息接收完成');
          if (aiMessageId) {
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, isStreaming: false, text: accumulatedTextRef.current }
                : msg
            ));
          }
        },
        // onError 回调
        (error) => {
          console.error('[useChat] 流式响应错误:', error);
          if (aiMessageId) {
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: '抱歉，发生了一些错误。请稍后再试。',
                    isStreaming: false
                  }
                : msg
            ));
          } else {
            // 如果还没有创建AI消息，直接创建错误消息
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              type: 'ai',
              text: '抱歉，发生了一些错误。请稍后再试。',
              timestamp: new Date(),
              action,
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }
      );
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

  const appendAssistantMessage = useCallback((payload = {}) => {
    const aiMessage = {
      id: (Date.now() + Math.random()).toString(),
      type: 'ai',
      timestamp: new Date(),
      ...payload,
    };

    setMessages((prev) => [...prev, aiMessage]);
  }, []);

  // 获取消息文本，如果是流式消息则返回累积文本
  const getMessageText = useCallback((message) => {
    if (message.isStreaming && message.id === messages.find((m) => m.isStreaming)?.id) {
      return accumulatedTextRef.current;
    }
    return message.text;
  }, [messages]); // 依赖 messages 确保重新渲染

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    getMessageText, // 添加获取消息文本的函数
    appendAssistantMessage,
  };
};
