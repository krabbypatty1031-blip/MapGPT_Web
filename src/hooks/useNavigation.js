/**
 * 导航管理 Hook
 * 负责与地图服务协作生成路线，维护导航状态
 */

import { useState, useCallback } from 'react';
import { buildRoute } from '../services/mapService';

export const useNavigation = () => {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const buildAndStoreRoute = useCallback(
    async (start, end, { silent = false, mode } = {}) => {
      if (!silent) {
        setRouteLoading(true);
      }
      setRouteError(null);

      try {
        const route = await buildRoute(start, end, { mode });
        setCurrentRoute(route);
        return route;
      } catch (error) {
        const message = error?.message || '路线规划失败';
        setRouteError(message);
        console.warn('[useNavigation] 构建路线失败:', message);
        return null;
      } finally {
        if (!silent) {
          setRouteLoading(false);
        }
      }
    },
    [],
  );

  const startNavigation = useCallback(
    async (start, end, options) => {
      const route = await buildAndStoreRoute(start, end, options);
      if (route) {
        setIsNavigating(true);
      }
      return route;
    },
    [buildAndStoreRoute],
  );

  const updateRoute = useCallback(
    async (start, end, options = {}) => buildAndStoreRoute(start, end, options),
    [buildAndStoreRoute],
  );

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentRoute(null);
    setRouteError(null);
  }, []);

  return {
    currentRoute,
    isNavigating,
    routeLoading,
    routeError,
    startNavigation,
    updateRoute,
    stopNavigation,
  };
};
