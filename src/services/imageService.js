/**
 * 图片服务
 * 处理图片选择、上传等业务逻辑
 */

import * as ImagePicker from 'expo-image-picker';
import { ImageAPI } from './api';

/**
 * 请求相册权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export const requestImagePermission = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status === 'granted') {
      return true;
    }
    
    console.warn('相册权限被拒绝');
    return false;
  } catch (error) {
    console.error('请求相册权限失败:', error);
    return false;
  }
};

/**
 * 选择图片
 * @param {Object} options - 选择选项
 * @returns {Promise<Object>} 选择结果
 */
export const pickImage = async (options = {}) => {
  try {
    // 请求权限
    const hasPermission = await requestImagePermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '需要相册权限才能选择图片',
      };
    }

    // 打开图片选择器
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing !== false,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        success: true,
        image: {
          id: Date.now().toString(),
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          uploading: true,
          progress: 0,
        },
      };
    }

    return { success: false, error: '未选择图片' };
  } catch (error) {
    console.error('选择图片失败:', error);
    return { success: false, error: error.message || '选择图片失败' };
  }
};

/**
 * 上传图片
 * @param {Object} image - 图片对象
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Object>} 上传结果
 */
export const uploadImage = async (image, onProgress) => {
  try {
    const result = await ImageAPI.uploadImage({
      uri: image.uri,
      imageId: image.id,
      onProgress,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('上传图片失败:', error);
    return {
      success: false,
      error: error.message || '图片上传失败',
    };
  }
};

/**
 * 分析图片
 * @param {string} imageUrl - 图片 URL
 * @param {string} analysisType - 分析类型
 * @returns {Promise<Object>} 分析结果
 */
export const analyzeImage = async (imageUrl, analysisType = 'landmark') => {
  try {
    const result = await ImageAPI.analyzeImage({
      imageUrl,
      analysisType,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('图片分析失败:', error);
    return {
      success: false,
      error: error.message || '图片分析失败',
    };
  }
};

export default {
  requestImagePermission,
  pickImage,
  uploadImage,
  analyzeImage,
};
