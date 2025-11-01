/**
 * 位置服务
 * 处理用户位置获取和位置相关的业务逻辑
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * 获取用户当前位置（使用 expo-location）
 * @param {Object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒）
 * @returns {Promise<Object>} 位置对象
 */
export const getUserLocation = async (options = {}) => {
  const { timeout = 15000 } = options;

  try {
    // 请求定位权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 定位权限状态:', status);

    if (status !== 'granted') {
      console.warn('❌ 定位权限被拒绝');
      throw new Error('定位权限被拒绝');
    }

    console.log('📍 开始获取位置，超时时间:', timeout, 'ms');

    // 获取当前位置（带超时）
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeoutMs: timeout,
    });

    console.log('✅ 获取位置成功:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('❌ 获取位置失败:', error.message);

    // 降级：尝试使用 Web Geolocation API
    if (Platform.OS === 'web' && navigator.geolocation) {
      console.log('🌐 尝试使用 Web Geolocation API');
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Web Geolocation 成功');
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (err) => {
            console.error('❌ Web Geolocation 失败:', err.message);
            reject(new Error(`定位失败: ${err.message}`));
          },
          { enableHighAccuracy: false, timeout: timeout, maximumAge: 0 },
        );
      });
    }

    // 非 Web 环境，抛出错误（不再自动回退到 Mock）
    throw error;
  }
};

/**
 * 生成模拟位置（用于开发和测试）
 * @param {Object} baseLocation - 基础位置
 * @param {number} offsetLat - 纬度偏移量
 * @param {number} offsetLng - 经度偏移量
 * @returns {Object} 模拟位置对象
 */
export const getMockLocation = (baseLocation, offsetLat = -0.002, offsetLng = -0.002) => {
  return {
    latitude: baseLocation.latitude + offsetLat,
    longitude: baseLocation.longitude + offsetLng,
    isMock: true,
  };
};

/**
 * 计算两点之间的距离（米）
 * 使用 Haversine 公式
 * @param {Object} point1 - 第一个点 {latitude, longitude}
 * @param {Object} point2 - 第二个点 {latitude, longitude}
 * @returns {number} 距离（米）
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距离（米）
};

/**
 * 检查位置权限状态
 * @returns {Promise<boolean>} 是否已授权
 */
export const checkLocationPermission = async () => {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    
    if (status === 'granted') {
      return true;
    }

    if (status === 'undetermined' && canAskAgain) {
      const permission = await Location.requestForegroundPermissionsAsync();
      return permission.status === 'granted';
    }

    return false;
  } catch (error) {
    console.error('检查位置权限失败:', error);
    return false;
  }
};

/**
 * 监听位置变化
 * @param {Function} callback - 位置变化时的回调函数
 * @returns {Promise<Object>} 位置订阅对象
 */
export const watchUserLocation = async (callback) => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    
    if (!permission || permission.status !== 'granted') {
      console.warn('位置权限被拒绝');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        if (location?.coords) {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            isMock: location.mocked || false,
          });
        }
      },
    );

    return subscription;
  } catch (error) {
    console.error('监听位置失败:', error);
    return null;
  }
};
