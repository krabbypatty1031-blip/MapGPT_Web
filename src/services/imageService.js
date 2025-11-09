/**
 * 图片服务
 * 负责相册权限、选择、上传与分析逻辑
 */

import * as ImagePicker from 'expo-image-picker';
import { ImageAPI } from './api';

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

export const pickImage = async (options = {}) => {
  try {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) {
      return { success: false, error: '需要相册权限才能选择图片' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing !== false,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const asset = result.assets?.[0];
    if (asset) {
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

export const uploadImage = async (image, onProgress) => {
  try {
    console.log('[ImageService] 开始上传图片', {
      id: image.id,
      uri: image.uri,
      hasProgress: !!onProgress,
    });

    const result = await ImageAPI.uploadImage({
      uri: image.uri,
      imageId: image.id,
      onProgress,
    });

    if (!result?.success) {
      throw new Error(result?.error || '上传失败');
    }

    return {
      success: true,
      data: result.data || result,
    };
  } catch (error) {
    console.error('[ImageService] 上传图片失败:', error);
    return {
      success: false,
      error: error.message || '图片上传失败',
    };
  }
};

export const analyzeImage = async (imageUrl, analysisType = 'landmark') => {
  try {
    const result = await ImageAPI.analyzeImage({
      imageUrl,
      analysisType,
    });

    if (!result?.success) {
      throw new Error(result?.error || '图片分析失败');
    }

    return {
      success: true,
      data: result.data,
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
