import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * 图片上传组件
 * @param {Array} images - 已上传的图片列表
 * @param {Function} onImagesChange - 图片变化回调
 * @param {number} maxImages - 最大图片数量
 */
const ImageUploader = ({ images = [], onImagesChange, maxImages = 9 }) => {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  // 选择图片
  const pickImage = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('需要相册权限才能选择图片');
        return;
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newImage = {
          id: Date.now().toString(),
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          uploading: true,
          progress: 0,
        };

        // 添加到图片列表
        const updatedImages = [...images, newImage];
        onImagesChange(updatedImages);

        // 开始上传
        uploadImage(newImage, updatedImages.length - 1);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      alert('选择图片失败');
    }
  };

  // 上传图片
  const uploadImage = async (image, index) => {
    try {
      setUploadingIndex(index);

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `image_${image.id}.jpg`,
      });

      // 模拟上传进度（实际项目中用 XMLHttpRequest 或 axios 实现真实进度）
      const simulateProgress = () => {
        return new Promise((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
            
            if (progress >= 90) {
              clearInterval(interval);
              resolve();
            }
          }, 200);
        });
      };

      await simulateProgress();

      // 实际上传到服务器
      const response = await fetch('https://your-api.com/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // 更新图片状态
        const updatedImages = [...images];
        updatedImages[index] = {
          ...image,
          uploading: false,
          progress: 100,
          url: data.url, // 服务器返回的图片 URL
        };
        
        setUploadProgress(prev => ({ ...prev, [image.id]: 100 }));
        onImagesChange(updatedImages);
        setUploadingIndex(null);
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      
      // 标记上传失败
      const updatedImages = [...images];
      updatedImages[index] = {
        ...image,
        uploading: false,
        error: true,
      };
      onImagesChange(updatedImages);
      setUploadingIndex(null);
      
      alert('图片上传失败，请重试');
    }
  };

  // 删除图片
  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  };

  // 渲染单个图片
  const renderImageItem = (image, index) => {
    const progress = uploadProgress[image.id] || 0;
    const isUploading = image.uploading && !image.error;

    return (
      <View key={image.id} style={styles.imageItem}>
        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        
        {/* 上传进度遮罩 */}
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              {/* 背景圆 */}
              <Circle
                cx="20"
                cy="20"
                r="18"
                stroke="#E5E6EB"
                strokeWidth="3"
                fill="none"
              />
              {/* 进度圆 */}
              <Circle
                cx="20"
                cy="20"
                r="18"
                stroke="#0090F0"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </Svg>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* 删除按钮 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeImage(image.id)}
          activeOpacity={0.7}
        >
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Circle cx="10" cy="10" r="10" fill="#000000" opacity="0.5" />
            <Path
              d="M6 6L14 14M14 6L6 14"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* 上传失败标识 */}
        {image.error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>上传失败</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => uploadImage(image, index)}
            >
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // 渲染添加按钮
  const renderAddButton = () => {
    if (images.length >= maxImages) return null;

    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <Path
            d="M16 8V24M8 16H24"
            stroke="#86909C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
    );
  };

  if (images.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.imageList}>
        {images.map((image, index) => renderImageItem(image, index))}
        {renderAddButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F7F8FA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginBottom: 4,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  retryText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E5E6EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageUploader;
