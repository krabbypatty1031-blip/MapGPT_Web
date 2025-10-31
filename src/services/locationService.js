/**
 * 位置服务
 * 处理用户位置获取和位置相关的业务逻辑
 */

// 暂时注释掉 expo-location 的导入，使用模拟位置
// import * as Location from 'expo-location';

/**
 * 获取用户当前位置
 * 注意：当前使用模拟位置，如需真实位置请取消注释上面的 import 并修改此函数
 * @returns {Promise<Object>} 包含经纬度的位置对象
 */
export const getUserLocation = async () => {
  try {
    console.log('📍 使用模拟位置（expo-location 未启用）');
    
    // 暂时返回 null，让调用方使用 getMockLocation
    return null;
    
    /* 真实位置获取代码（需要 expo-location）
    // 请求位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('位置权限被拒绝');
      return null;
    }

    // 获取当前位置
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
    */
  } catch (error) {
    console.error('获取位置失败:', error);
    return null;
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
    // 暂时返回 false，因为未启用 expo-location
    console.log('📍 位置权限检查（模拟模式）');
    return false;
    
    /* 真实位置权限检查（需要 expo-location）
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
    */
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
    console.log('📍 位置监听（模拟模式，未启用）');
    // 暂时返回 null，因为未启用 expo-location
    return null;
    
    /* 真实位置监听（需要 expo-location）
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('位置权限被拒绝');
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // 5秒更新一次
        distanceInterval: 10, // 移动10米更新一次
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );

    return subscription;
    */
  } catch (error) {
    console.error('监听位置失败:', error);
    return null;
  }
};
