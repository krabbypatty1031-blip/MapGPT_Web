/**
 * 地图状态管理 Hook
 * 集中管理地图相关的所有状态和交互逻辑
 */

import { useState, useCallback, useEffect } from 'react';
import { processMarkerData } from '../services/mapService';
import { useLocation } from './useLocation';
import { useNavigation } from './useNavigation';

/**
 * 地图状态管理 Hook
 * @param {Object} options - 配置选项
 * @returns {Object} 地图状态和方法
 */
export const useMap = (options = {}) => {
  const {
    onOpen,
    onClose,
    enableLocationTracking = false,
    useMockLocation = true, // 默认使用模拟位置
  } = options;

  // 地图基础状态
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [routeDrawerVisible, setRouteDrawerVisible] = useState(false);

  // 防止重复点击的标记
  const [lastMarkerPressTime, setLastMarkerPressTime] = useState(0);

  // 使用位置 Hook
  const {
    userLocation,
    loading: locationLoading,
    error: locationError,
    fetchLocation,
    clearLocation,
  } = useLocation(enableLocationTracking, useMockLocation);

  // 使用导航 Hook
  const {
    currentRoute,
    availableRoutes,
    isNavigating,
    startNavigation,
    switchRoute,
    stopNavigation,
  } = useNavigation();

  /**
   * 地图加载完成
   */
  const handleMapReady = useCallback(() => {
    console.log('✅ 地图加载完成');
    setMapReady(true);
    setHasError(false); // 确保没有错误状态
  }, []);

  /**
   * 地图加载错误
   */
  const handleMapError = useCallback((error) => {
    console.error('❌ 地图加载错误:', error);
    setHasError(true);
    setMapReady(true); // 即使出错也设置为ready，让地图可用
  }, []);

  /**
   * 标记点击处理
   */
  const handleMarkerPress = useCallback((marker) => {
    const now = Date.now();
    // 防止500ms内的重复点击
    if (now - lastMarkerPressTime < 500) {
      console.log('⚠️ 忽略快速重复的marker点击');
      return;
    }
    
    setLastMarkerPressTime(now);
    console.log('📍 建筑物被选中:', {
      id: marker.id,
      title: marker.title,
      coordinate: marker.coordinate,
      type: marker.type,
      timestamp: new Date().toISOString()
    });
    const processedMarker = processMarkerData(marker);
    setSelectedBuilding(processedMarker);
    setDrawerVisible(true);
  }, [lastMarkerPressTime]);

  /**
   * 关闭建筑详情抽屉
   */
  const handleDrawerClose = useCallback(() => {
    setDrawerVisible(false);
    setTimeout(() => {
      setSelectedBuilding(null);
    }, 300);
  }, []);

  /**
   * 开始导航到建筑物
   */
  const handleNavigate = useCallback(async (buildingInfo) => {
    console.log('🗺️ 导航到:', buildingInfo);
    
    // 获取用户位置
    let location = userLocation;
    if (!location) {
      await fetchLocation();
      location = userLocation;
    }
    
    if (!location) {
      console.error('无法获取用户位置');
      return;
    }
    
    // 关闭建筑详情抽屉
    setDrawerVisible(false);
    
    // 开始导航
    const destination = {
      latitude: buildingInfo.latitude,
      longitude: buildingInfo.longitude,
    };
    
    startNavigation(location, destination);
    
    // 显示路线选择抽屉
    setRouteDrawerVisible(true);
  }, [userLocation, fetchLocation, startNavigation]);

  /**
   * 路线选择处理
   */
  const handleRouteSelect = useCallback((route) => {
    console.log('🗺️ 选择路线:', route);
    switchRoute(route.id);
  }, [switchRoute]);

  /**
   * 关闭路线抽屉
   */
  const handleRouteDrawerClose = useCallback(() => {
    setRouteDrawerVisible(false);
    stopNavigation();
    clearLocation();
  }, [stopNavigation, clearLocation]);

  /**
   * 返回按钮处理
   */
  const handleBackPress = useCallback(() => {
    if (routeDrawerVisible) {
      // 如果正在显示路线规划，关闭它
      handleRouteDrawerClose();
    } else {
      // 否则返回 false，让外部处理（通常是关闭地图）
      return false;
    }
    return true;
  }, [routeDrawerVisible, handleRouteDrawerClose]);

  /**
   * 重置所有状态
   */
  const resetMapState = useCallback(() => {
    setMapReady(false);
    setHasError(false);
    setDrawerVisible(false);
    setRouteDrawerVisible(false);
    setSelectedBuilding(null);
    stopNavigation();
    clearLocation();
  }, [stopNavigation, clearLocation]);

  /**
   * 当地图打开时的处理
   */
  useEffect(() => {
    if (onOpen) {
      onOpen();
    }
  }, [onOpen]);

  return {
    // 地图状态
    mapReady,
    hasError,
    
    // 建筑相关
    selectedBuilding,
    drawerVisible,
    
    // 路线相关
    currentRoute,
    availableRoutes,
    routeDrawerVisible,
    isNavigating,
    
    // 位置相关
    userLocation,
    locationLoading,
    locationError,
    
    // 事件处理
    handleMapReady,
    handleMapError,
    handleMarkerPress,
    handleDrawerClose,
    handleNavigate,
    handleRouteSelect,
    handleRouteDrawerClose,
    handleBackPress,
    
    // 工具方法
    resetMapState,
    fetchLocation,
  };
};
