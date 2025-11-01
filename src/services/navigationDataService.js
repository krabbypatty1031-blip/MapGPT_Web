/**
 * 导航/图层数据服务
 * 提供建筑多边形、道路缓冲和路线规划等接口封装
 */

import { apiRequest } from './api';

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (entries.length === 0) {
    return '';
  }

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `?${query}`;
};

export const fetchBuildingPolygons = async (bounds) => {
  const query = bounds
    ? buildQueryString({
        minLon: bounds.minLon,
        minLat: bounds.minLat,
        maxLon: bounds.maxLon,
        maxLat: bounds.maxLat,
      })
    : '';

  const response = await apiRequest(`/api/geoserver/buildings-polygon${query}`, {
    method: 'GET',
  });

  if (!response.success) {
    throw new Error(response.error || '无法获取建筑物多边形数据');
  }

  return response.data;
};

export const fetchRoadBuffers = async (buffer = 5) => {
  const query = buildQueryString({ buffer });
  const response = await apiRequest(`/api/hkroads0-all${query}`, {
    method: 'GET',
  });

  if (!response.success) {
    throw new Error(response.error || '无法获取道路缓冲图层');
  }

  return response.data;
};

export const fetchRoutePath = async ({ start, end, mode = 'custom' }) => {
  if (!start || !end) {
    throw new Error('缺少起点或终点');
  }

  const query = buildQueryString({
    lon1: start.longitude,
    lat1: start.latitude,
    lon2: end.longitude,
    lat2: end.latitude,
    mode,
  });

  const response = await apiRequest(`/api/route${query}`, {
    method: 'GET',
  });

  if (!response.success) {
    throw new Error(response.error || '无法获取路线规划结果');
  }

  return response.data;
};
