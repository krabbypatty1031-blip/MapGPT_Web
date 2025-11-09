/**
 * useMapModal Hook
 * 管理地图模态框的状态和逻辑
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { HKBU_LOCATION, CAMPUS_MARKERS } from '../constants/mapData';
import { filterValidLocations } from '../utils/validation';

/**
 * 地图模态框管理 Hook
 * @param {Array} messages - 消息列表
 * @returns {Object} 地图模态框状态和方法
 */
export const useMapModal = (messages = []) => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [currentMapData, setCurrentMapData] = useState(null);
  const [routeLocations, setRouteLocations] = useState([]);

  /**
   * 监听新消息，自动显示路线规划地图
   * 当收到包含位置信息的 AI 回复时，自动打开地图
   */
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    
    if (
      !latestMessage ||
      latestMessage.type !== 'ai' ||
      !Array.isArray(latestMessage.locations) ||
      latestMessage.locations.length === 0
    ) {
      return;
    }

    const validLocations = filterValidLocations(latestMessage.locations);

    if (validLocations.length > 0) {
      setRouteLocations(validLocations);
      setCurrentMapData({
        message: latestMessage,
        region: HKBU_LOCATION,
        markers: CAMPUS_MARKERS,
      });
      setIsMapVisible(true);
    }
  }, [messages]);

  /**
   * 处理查看地图按钮点击
   * 从消息中提取位置信息并显示在地图上
   */
  const handleViewMap = useCallback((message) => {
    const locations = message.locations || [];
    
    // 更新路线位置，确保地图上显示正确的标记
    if (locations.length > 0) {
      setRouteLocations(locations);
    }
    
    setCurrentMapData({
      message,
      region: HKBU_LOCATION,
      markers: CAMPUS_MARKERS,
    });
    setIsMapVisible(true);
  }, []);

  /**
   * 关闭地图
   */
  const handleCloseMap = useCallback(() => {
    setIsMapVisible(false);
  }, []);

  /**
   * 计算地图标记列表
   * 合并静态标记和路线位置标记
   */
  const markers = useMemo(() => {
    const staticMarkers = (currentMapData?.markers || []).filter(
      (marker) =>
        marker.coordinate &&
        typeof marker.coordinate.latitude === 'number' &&
        typeof marker.coordinate.longitude === 'number',
    );

    const routeMarkers = filterValidLocations(routeLocations).map((location) => ({
      id: `route-${location.id}`,
      coordinate: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      title: location.name,
      description: location.description,
      features: location.features,
      type: location.type,
    }));

    return [...staticMarkers, ...routeMarkers];
  }, [currentMapData?.markers, routeLocations]);

  /**
   * 清空路线位置
   */
  const clearRouteLocations = useCallback(() => {
    setRouteLocations([]);
  }, []);

  return {
    // 状态
    isMapVisible,
    currentMapData,
    routeLocations,
    markers,
    
    // 方法
    handleViewMap,
    handleCloseMap,
    clearRouteLocations,
    setRouteLocations,
  };
};

export default useMapModal;

