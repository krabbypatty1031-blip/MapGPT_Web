/**
 * 导航/图层数据服务（离线模式）
 * 使用本地静态数据模拟三方接口
 */

import {
  buildOfflineRoute,
  getBuildingFeatureCollection,
  getRoadFeatureCollection,
  simulateLatency,
} from './offlineData';

export const fetchBuildingPolygons = async (bounds) =>
  simulateLatency(() => getBuildingFeatureCollection(bounds));

export const fetchRoadBuffers = async (_buffer = 5, bounds) =>
  simulateLatency(() => getRoadFeatureCollection(bounds));

export const fetchRoutePath = async ({ start, end }) => {
  if (!start || !end) {
    throw new Error('缺少起点或终点');
  }
  return simulateLatency(() => buildOfflineRoute(start, end));
};
