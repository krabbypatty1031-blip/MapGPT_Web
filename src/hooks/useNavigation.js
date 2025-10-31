/**
 * 导航管理 Hook
 * 管理路线生成、选择和导航状态
 */

import { useState, useCallback } from 'react';
import { generateRoute, generateAllRoutes, ROUTE_TYPES } from '../services/mapService';

/**
 * 导航管理 Hook
 * @returns {Object} 导航状态和方法
 */
export const useNavigation = () => {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * 开始导航
   * @param {Object} start - 起点
   * @param {Object} end - 终点
   * @param {number} routeType - 路线类型（可选，默认为最快路线）
   */
  const startNavigation = useCallback((start, end, routeType = ROUTE_TYPES.FASTEST) => {
    console.log('🗺️ 开始导航:', { start, end, routeType });
    
    // 生成所有可选路线
    const routes = generateAllRoutes(start, end);
    setAvailableRoutes(routes);
    
    // 设置当前路线
    const route = routes[routeType];
    setCurrentRoute(route);
    setIsNavigating(true);
    
    return route;
  }, []);

  /**
   * 切换路线
   * @param {number} routeType - 路线类型
   */
  const switchRoute = useCallback((routeType) => {
    if (!currentRoute) {
      console.warn('没有正在进行的导航');
      return;
    }

    console.log('🗺️ 切换路线:', routeType);
    
    const route = generateRoute(currentRoute.start, currentRoute.end, routeType);
    setCurrentRoute(route);
    
    return route;
  }, [currentRoute]);

  /**
   * 停止导航
   */
  const stopNavigation = useCallback(() => {
    console.log('🗺️ 停止导航');
    setCurrentRoute(null);
    setAvailableRoutes([]);
    setIsNavigating(false);
  }, []);

  /**
   * 重新计算路线（例如用户偏离路线时）
   * @param {Object} newStart - 新的起点
   */
  const recalculateRoute = useCallback((newStart) => {
    if (!currentRoute) {
      console.warn('没有正在进行的导航');
      return;
    }

    console.log('🗺️ 重新计算路线');
    
    const route = generateRoute(newStart, currentRoute.end, currentRoute.routeType);
    setCurrentRoute(route);
    
    return route;
  }, [currentRoute]);

  return {
    // 状态
    currentRoute,
    availableRoutes,
    isNavigating,
    
    // 方法
    startNavigation,
    switchRoute,
    stopNavigation,
    recalculateRoute,
  };
};
