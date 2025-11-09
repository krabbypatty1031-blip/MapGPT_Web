/**
 * 地图相关常量
 * 集中管理地图组件使用的常量配置
 */

// 地图模态框尺寸配置
export const MAP_MODAL_DIMENSIONS = {
  WIDTH: 355,
  HEADER_HEIGHT: 80,
  HEADER_HEIGHT_IOS: 100,
  QUICK_ACTIONS_HEIGHT: 33,
  QUICK_ACTIONS_MARGIN: 28,
  BOTTOM_TO_QUICK_ACTIONS: 20,
};

// 地图缩放级别
export const MAP_ZOOM_LEVELS = {
  DEFAULT: 16,
  MIN: 10,
  MAX: 20,
  BUILDING: 18,
  CAMPUS: 15,
};

// 地图边距配置
export const MAP_PADDING = {
  TOP: 120,
  RIGHT: 72,
  BOTTOM: 240,
  LEFT: 72,
};

// 多边形样式配置
export const POLYGON_STYLES = {
  ROAD: {
    strokeColor: 'rgba(90, 90, 90, 0.5)',
    strokeOpacity: 0.5,
    strokeWeight: 1,
    fillColor: 'rgba(128, 128, 128, 0.08)',
    fillOpacity: 0.08,
    zIndex: 1,
  },
  BUILDING: {
    strokeColor: 'rgba(0, 122, 255, 0.5)',
    strokeOpacity: 0.5,
    strokeWeight: 1,
    fillColor: 'rgba(0, 122, 255, 0.06)',
    fillOpacity: 0.06,
    zIndex: 2,
  },
};

// 标记样式配置
export const MARKER_STYLES = {
  USER_LOCATION: {
    fillColor: '#007AFF',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8,
    zIndex: 100,
  },
  DESTINATION: {
    fillColor: '#FF3B30',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8,
    zIndex: 100,
  },
  DEFAULT: {
    zIndex: 10,
  },
};

// 路线样式配置
export const ROUTE_STYLES = {
  strokeColor: '#007AFF',
  strokeOpacity: 1.0,
  strokeWeight: 5,
  zIndex: 3,
};

// 地图加载配置
export const MAP_LOADING_CONFIG = {
  INIT_DELAY: 100, // 地图初始化延迟（毫秒）
  SDK_TIMEOUT: 10000, // SDK 加载超时（毫秒）
};

export default {
  MAP_MODAL_DIMENSIONS,
  MAP_ZOOM_LEVELS,
  MAP_PADDING,
  POLYGON_STYLES,
  MARKER_STYLES,
  ROUTE_STYLES,
  MAP_LOADING_CONFIG,
};

