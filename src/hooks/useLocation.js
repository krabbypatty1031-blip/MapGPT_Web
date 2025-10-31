/**
 * 位置管理 Hook
 * 管理用户位置获取和更新
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserLocation, getMockLocation, watchUserLocation } from '../services/locationService';
import { MAP_CONFIG } from '../config/mapConfig';

/**
 * 位置管理 Hook
 * @param {boolean} enableTracking - 是否启用位置追踪
 * @param {boolean} useMockLocation - 是否使用模拟位置（开发模式）
 * @returns {Object} 位置状态和方法
 */
export const useLocation = (enableTracking = false, useMockLocation = false) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 获取当前位置
   */
  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (useMockLocation) {
        // 开发模式：使用模拟位置
        const mockLocation = getMockLocation(MAP_CONFIG.defaultCenter);
        setUserLocation(mockLocation);
        console.log('📍 使用模拟位置:', mockLocation);
      } else {
        // 生产模式：获取真实位置
        const location = await getUserLocation();
        if (location) {
          setUserLocation(location);
          console.log('📍 获取到用户位置:', location);
        } else {
          setError('无法获取位置');
        }
      }
    } catch (err) {
      console.error('位置获取失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [useMockLocation]);

  /**
   * 清除位置
   */
  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setError(null);
  }, []);

  /**
   * 启用位置追踪
   */
  useEffect(() => {
    if (!enableTracking) return;

    let subscription = null;

    const startTracking = async () => {
      if (useMockLocation) {
        // 模拟模式不需要追踪
        return;
      }

      subscription = await watchUserLocation((location) => {
        setUserLocation(location);
        console.log('📍 位置更新:', location);
      });
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enableTracking, useMockLocation]);

  return {
    userLocation,
    loading,
    error,
    fetchLocation,
    clearLocation,
  };
};
