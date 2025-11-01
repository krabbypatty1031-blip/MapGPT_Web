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

  const fetchLocation = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        // 如果明确要求使用模拟位置
        if (useMockLocation) {
          const mockLocation = getMockLocation(MAP_CONFIG.defaultCenter);
          setUserLocation(mockLocation);
          console.log('📍 使用模拟位置:', mockLocation);
          return mockLocation;
        }

        // 尝试获取真实位置
        console.log('📍 尝试获取真实位置...');
        const location = await getUserLocation({ timeout: 15000 });

        if (location) {
          setUserLocation(location);
          console.log('✅ 获取到用户位置:', location);
          return location;
        }

        // getUserLocation 返回 null（不应该发生，因为现在会抛出错误）
        throw new Error('无法获取当前位置');
      } catch (err) {
        console.error('❌ 位置获取失败:', err);

        // 如果允许使用模拟位置，则回退到模拟位置
        if (useMockLocation) {
          const fallback = getMockLocation(MAP_CONFIG.defaultCenter, -0.0008, -0.0008);
          setUserLocation(fallback);
          console.warn('⚠️ 使用模拟位置作为回退');
          return fallback;
        }

        // 不允许使用模拟位置，设置错误并返回 null
        const message = err?.message || '无法获取位置';
        if (!silent) {
          setError(message);
        }
        console.error('❌ 真实定位失败且不允许使用模拟位置');
        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [useMockLocation],
  );

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!enableTracking) {
      return undefined;
    }

    let subscription = null;

    const startTracking = async () => {
      if (useMockLocation) {
        return;
      }

      subscription = await watchUserLocation((location) => {
        setUserLocation(location);
        console.log('📍 位置更新:', location);
      });
    };

    startTracking();

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
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
