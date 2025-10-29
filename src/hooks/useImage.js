import { useState, useCallback } from 'react';
import * as ImageService from '../services/imageService';

/**
 * 图片功能 Hook
 * 封装图片选择、上传的状态管理和逻辑
 */
export const useImage = () => {
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 选择并上传图片
   * @param {Object} options - 选择选项
   * @returns {Promise<Object>} 结果
   */
  const pickAndUploadImage = useCallback(async (options = {}) => {
    // 选择图片
    const pickResult = await ImageService.pickImage(options);
    
    if (!pickResult.success) {
      if (pickResult.error) {
        alert(pickResult.error);
      }
      return pickResult;
    }

    const newImage = pickResult.image;

    // 添加到列表
    setImages(prev => [...prev, newImage]);
    setIsUploading(true);

    // 上传图片
    const uploadResult = await ImageService.uploadImage(
      newImage,
      (progress) => {
        setUploadProgress(prev => ({ ...prev, [newImage.id]: progress }));
      }
    );

    if (uploadResult.success) {
      // 更新图片状态为上传完成
      setImages(prev => prev.map(img => 
        img.id === newImage.id 
          ? { ...img, uploading: false, progress: 100, url: uploadResult.data.url } 
          : img
      ));
      setUploadProgress(prev => ({ ...prev, [newImage.id]: 100 }));
      
      console.log('图片上传成功:', uploadResult.data);
    } else {
      // 标记上传失败
      setImages(prev => prev.map(img =>
        img.id === newImage.id ? { ...img, uploading: false, error: true } : img
      ));
      
      alert(uploadResult.error || '图片上传失败，请重试');
    }

    setIsUploading(false);

    return {
      success: uploadResult.success,
      image: uploadResult.success ? {
        ...newImage,
        url: uploadResult.data.url,
        uploading: false,
        progress: 100,
      } : newImage,
    };
  }, []);

  /**
   * 删除图片
   * @param {string} imageId - 图片 ID
   */
  const removeImage = useCallback((imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[imageId];
      return newProgress;
    });
  }, []);

  /**
   * 清空所有图片
   */
  const clearImages = useCallback(() => {
    setImages([]);
    setUploadProgress({});
  }, []);

  /**
   * 分析图片
   * @param {string} imageUrl - 图片 URL
   * @param {string} analysisType - 分析类型
   * @returns {Promise<Object>} 分析结果
   */
  const analyzeImage = useCallback(async (imageUrl, analysisType = 'landmark') => {
    return await ImageService.analyzeImage(imageUrl, analysisType);
  }, []);

  return {
    images,
    uploadProgress,
    isUploading,
    pickAndUploadImage,
    removeImage,
    clearImages,
    setImages, // 允许外部直接设置（用于清空等场景）
    analyzeImage,
  };
};
