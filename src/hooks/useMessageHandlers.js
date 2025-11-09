/**
 * useMessageHandlers Hook
 * 管理消息发送和处理逻辑
 */
import { useCallback } from 'react';

/**
 * 消息处理器 Hook
 * @param {Object} params - 参数对象
 * @returns {Object} 消息处理方法
 */
export const useMessageHandlers = ({
  selectedAction,
  images,
  clearImages,
  sendMessage,
  analyzeImage,
  appendAssistantMessage,
  clearRouteLocations,
}) => {
  /**
   * 处理图片分析
   */
  const handleImageAnalysis = useCallback(
    async (imageList = []) => {
      for (const image of imageList) {
        if (!image?.url) {
          continue;
        }

        try {
          const result = await analyzeImage(image.url, 'landmark');
          if (result?.success && result.data) {
            const { caption, tags, recommendations, analysisType } = result.data;
            appendAssistantMessage({
              text: caption,
              action: 'image',
              images: [{ id: image.id, url: image.url }],
              analysis: {
                type: analysisType || 'landmark',
                tags,
                recommendations,
              },
            });
          }
        } catch (error) {
          console.error('[MessageHandlers] 图片分析失败:', error);
        }
      }
    },
    [analyzeImage, appendAssistantMessage],
  );

  /**
   * 发送消息
   */
  const handleSendMessage = useCallback(
    async (text) => {
      if (!selectedAction) {
        console.warn('[MessageHandlers] 未选择操作类型，无法发送消息');
        return;
      }

      const currentImages = [...images];
      const currentAction = selectedAction;

      // 清理状态
      clearImages();
      clearRouteLocations?.();

      // 发送消息
      await sendMessage(text, currentAction, currentImages);

      // 处理图片分析
      if (currentAction === 'image') {
        await handleImageAnalysis(currentImages);
      }
    },
    [
      selectedAction,
      images,
      clearImages,
      sendMessage,
      handleImageAnalysis,
      clearRouteLocations,
    ],
  );

  return {
    handleSendMessage,
    handleImageAnalysis,
  };
};

export default useMessageHandlers;

