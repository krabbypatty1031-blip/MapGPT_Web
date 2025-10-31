/**
 * 地图服务
 * 处理路线生成、地图数据处理等业务逻辑
 */

import { calculateDistance } from './locationService';

/**
 * 路线类型枚举
 */
export const ROUTE_TYPES = {
  FASTEST: 0, // 时间最少
  SHORTEST: 1, // 距离最短
  ALTERNATIVE: 2, // 备选方案
};

/**
 * 路线颜色映射
 */
export const ROUTE_COLORS = {
  [ROUTE_TYPES.FASTEST]: '#0090F0',
  [ROUTE_TYPES.SHORTEST]: '#00C853',
  [ROUTE_TYPES.ALTERNATIVE]: '#FF6B00',
};

/**
 * 生成路线坐标点
 * @param {Object} start - 起点 {latitude, longitude}
 * @param {Object} end - 终点 {latitude, longitude}
 * @param {number} routeType - 路线类型
 * @returns {Object} 路线信息
 */
export const generateRoute = (start, end, routeType = ROUTE_TYPES.FASTEST) => {
  // 计算直线距离
  const distance = calculateDistance(start, end);
  
  // 根据路线类型生成不同的路径点
  const routes = {
    [ROUTE_TYPES.FASTEST]: generateFastestRoute(start, end),
    [ROUTE_TYPES.SHORTEST]: generateShortestRoute(start, end),
    [ROUTE_TYPES.ALTERNATIVE]: generateAlternativeRoute(start, end),
  };

  const coordinates = routes[routeType];
  
  // 计算估计时间和距离
  const routeDistance = calculateRouteDistance(coordinates);
  const estimatedTime = calculateEstimatedTime(routeDistance, routeType);

  return {
    coordinates,
    start,
    end,
    routeType,
    distance: routeDistance,
    estimatedTime,
    color: ROUTE_COLORS[routeType],
  };
};

/**
 * 生成最快路线（时间最少）
 * @private
 */
const generateFastestRoute = (start, end) => {
  return [
    start,
    { 
      latitude: start.latitude + 0.0005, 
      longitude: start.longitude + 0.001 
    },
    { 
      latitude: start.latitude + 0.001, 
      longitude: start.longitude + 0.0015 
    },
    { 
      latitude: end.latitude - 0.0003, 
      longitude: end.longitude - 0.0002 
    },
    end,
  ];
};

/**
 * 生成最短路线（距离最短）
 * @private
 */
const generateShortestRoute = (start, end) => {
  return [
    start,
    { 
      latitude: start.latitude + 0.0008, 
      longitude: start.longitude + 0.0008 
    },
    { 
      latitude: end.latitude - 0.0002, 
      longitude: end.longitude - 0.0002 
    },
    end,
  ];
};

/**
 * 生成备选路线（绕路）
 * @private
 */
const generateAlternativeRoute = (start, end) => {
  return [
    start,
    { 
      latitude: start.latitude + 0.0003, 
      longitude: start.longitude + 0.0012 
    },
    { 
      latitude: start.latitude + 0.0008, 
      longitude: start.longitude + 0.002 
    },
    { 
      latitude: end.latitude - 0.0001, 
      longitude: end.longitude + 0.0003 
    },
    end,
  ];
};

/**
 * 计算路线总距离
 * @param {Array} coordinates - 路线坐标数组
 * @returns {number} 总距离（米）
 */
export const calculateRouteDistance = (coordinates) => {
  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  
  return totalDistance;
};

/**
 * 计算估计时间
 * @param {number} distance - 距离（米）
 * @param {number} routeType - 路线类型
 * @returns {number} 估计时间（分钟）
 */
export const calculateEstimatedTime = (distance, routeType) => {
  // 平均步行速度：约 5 km/h = 83.33 m/min
  const walkingSpeed = 83.33;
  
  // 不同路线类型的速度系数
  const speedFactors = {
    [ROUTE_TYPES.FASTEST]: 1.2, // 较快
    [ROUTE_TYPES.SHORTEST]: 1.0, // 正常
    [ROUTE_TYPES.ALTERNATIVE]: 0.9, // 较慢
  };
  
  const effectiveSpeed = walkingSpeed * (speedFactors[routeType] || 1.0);
  return Math.round(distance / effectiveSpeed);
};

/**
 * 生成所有可选路线
 * @param {Object} start - 起点
 * @param {Object} end - 终点
 * @returns {Array} 路线数组
 */
export const generateAllRoutes = (start, end) => {
  return [
    generateRoute(start, end, ROUTE_TYPES.FASTEST),
    generateRoute(start, end, ROUTE_TYPES.SHORTEST),
    generateRoute(start, end, ROUTE_TYPES.ALTERNATIVE),
  ];
};

/**
 * 格式化距离显示
 * @param {number} distance - 距离（米）
 * @returns {string} 格式化后的距离
 */
export const formatDistance = (distance) => {
  if (typeof distance !== 'number' || isNaN(distance)) {
    return '未知距离';
  }
  
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

/**
 * 格式化时间显示
 * @param {number} minutes - 时间（分钟）
 * @returns {string} 格式化后的时间
 */
export const formatTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

/**
 * 处理标记点数据
 * @param {Object} marker - 原始标记数据
 * @returns {Object} 处理后的标记数据
 */
export const processMarkerData = (marker) => {
  // 确保坐标存在且为数字
  const latitude = typeof marker.latitude === 'number' ? marker.latitude : 0;
  const longitude = typeof marker.longitude === 'number' ? marker.longitude : 0;
  
  return {
    title: marker.title || '建筑物',
    position: marker.position || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    features: marker.features || marker.description || '暂无特点信息',
    description: marker.description,
    latitude: latitude,
    longitude: longitude,
    ...marker,
  };
};
