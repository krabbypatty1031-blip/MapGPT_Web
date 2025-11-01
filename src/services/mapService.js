/**
 * 地图服务
 * 负责图层数据、路线构建、标记处理等逻辑
 */

import { MAP_CONFIG } from '../config/mapConfig';
import { calculateDistance } from './locationService';
import {
  fetchBuildingPolygons,
  fetchRoadBuffers,
  fetchRoutePath,
} from './navigationDataService';

const BUILDING_LIMIT = 200;
const ROAD_LIMIT = 400;
const ROAD_BUFFER_DEFAULT = 8;

let buildingLayerUnavailable = false;
let roadLayerUnavailable = false;

const parseGeometry = (geometry) => {
  if (!geometry) return null;

  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry);
    } catch (error) {
      console.warn('[mapService] 无法解析几何字符串:', error);
      return null;
    }
  }

  if (geometry.type && geometry.coordinates) {
    return geometry;
  }

  if (geometry.geometry) {
    return parseGeometry(geometry.geometry);
  }

  return null;
};

const toLatLng = (pair) => {
  if (!Array.isArray(pair) || pair.length < 2) return null;
  let [lng, lat] = pair;

  if (!isFinite(lat) || !isFinite(lng)) return null;

  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const tmp = lat;
    lat = lng;
    lng = tmp;
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { latitude: lat, longitude: lng };
};

const convertPolygonCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length === 0) {
    return null;
  }

  const outerRing = coords[0].map(toLatLng).filter(Boolean);
  if (outerRing.length < 3) {
    return null;
  }

  const holes = coords
    .slice(1)
    .map((ring) => ring.map(toLatLng).filter(Boolean))
    .filter((ring) => ring.length >= 3);

  return { coordinates: outerRing, holes };
};

const geometryToPolygons = (geometry) => {
  const parsed = parseGeometry(geometry);
  if (!parsed) return [];

  if (parsed.type === 'Polygon') {
    const polygon = convertPolygonCoordinates(parsed.coordinates);
    return polygon ? [polygon] : [];
  }

  if (parsed.type === 'MultiPolygon') {
    return parsed.coordinates.map(convertPolygonCoordinates).filter(Boolean);
  }

  return [];
};

const collectAllCoordinates = (polygons) => {
  const coords = [];
  polygons.forEach((p) => {
    if (Array.isArray(p.coordinates)) {
      coords.push(...p.coordinates);
    }
    if (Array.isArray(p.holes)) {
      p.holes.forEach((hole) => {
        if (Array.isArray(hole)) coords.push(...hole);
      });
    }
  });
  return coords.filter((c) => c && isFinite(c.latitude) && isFinite(c.longitude));
};

const computeBoundsFromPolygons = (polygons) => {
  const coords = collectAllCoordinates(polygons);
  if (coords.length < 2) return null;

  const latitudes = coords.map((c) => c.latitude);
  const longitudes = coords.map((c) => c.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  return {
    sw: { latitude: minLat, longitude: minLon },
    ne: { latitude: maxLat, longitude: maxLon },
  };
};

const computeBoundsFromRegion = (region) => {
  if (!region) return null;

  const latitudeDelta = region.latitudeDelta || 0.01;
  const longitudeDelta = region.longitudeDelta || 0.01;

  return {
    minLat: region.latitude - latitudeDelta,
    maxLat: region.latitude + latitudeDelta,
    minLon: region.longitude - longitudeDelta,
    maxLon: region.longitude + longitudeDelta,
  };
};

const normaliseRouteCoordinates = (pairs) =>
  pairs
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      let [lng, lat] = pair;
      if (!isFinite(lat) || !isFinite(lng)) return null;
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        const tmp = lat;
        lat = lng;
        lng = tmp;
      }
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { latitude: lat, longitude: lng };
    })
    .filter(Boolean);

const fallbackRoute = (start, end) => {
  return {
    coordinates: [
      start,
      {
        latitude: (start.latitude + end.latitude) / 2 + 0.0005,
        longitude: (start.longitude + end.longitude) / 2,
      },
      end,
    ],
  };
};

const parseRouteResponse = (data, start, end) => {
  if (!data) return null;

  if (Array.isArray(data.coordinates)) {
    const coordinates = normaliseRouteCoordinates(data.coordinates);
    if (coordinates.length > 1) {
      return {
        coordinates,
        info: data.info || data.summary || null,
      };
    }
  }

  if (Array.isArray(data.features)) {
    const lineFeature = data.features.find((feature) => {
      const geometry = parseGeometry(feature.geometry);
      return geometry && typeof geometry.type === 'string' && geometry.type.toLowerCase().includes('line');
    });

    if (lineFeature) {
      const geometry = parseGeometry(lineFeature.geometry);
      const coordinates = normaliseRouteCoordinates(geometry.coordinates || []);
      const properties = lineFeature.properties || {};

      if (coordinates.length > 1) {
        return {
          coordinates,
          info: {
            distance: properties.distance_m,
            duration: properties.duration_s,
            note: properties.note,
            segments: properties.road_segments,
          },
        };
      }
    }
  }

  if (Array.isArray(data.paths) && data.paths.length > 0) {
    const path = data.paths[0];
    const coordinates = normaliseRouteCoordinates(path.points || []);
    if (coordinates.length > 1) {
      return {
        coordinates,
        info: {
          distance: path.distance,
          duration: path.duration,
        },
      };
    }
  }

  return fallbackRoute(start, end);
};

const ensureDistance = (route) => {
  if (!route) return null;
  const routeDistance = calculateRouteDistance(route.coordinates);
  if (!route.info) {
    route.info = {};
  }
  if (!isFinite(route.info.distance)) {
    route.info.distance = routeDistance;
  }
  if (!isFinite(route.info.duration)) {
    route.info.duration = estimateDuration(routeDistance);
  }
  return route;
};

export const loadMapLayers = async ({
  region,
  bounds,
  buildingLimit = BUILDING_LIMIT,
  roadLimit = ROAD_LIMIT,
  roadBuffer = ROAD_BUFFER_DEFAULT,
} = {}) => {
  const resolvedBounds = bounds || computeBoundsFromRegion(region || MAP_CONFIG.defaultCenter);

  const shouldFetchBuildings = !buildingLayerUnavailable && buildingLimit !== 0;
  const shouldFetchRoads = !roadLayerUnavailable && roadLimit !== 0;

  const warnings = [];

  let buildingFeatures = [];
  if (shouldFetchBuildings) {
    try {
      const buildingData = await fetchBuildingPolygons(resolvedBounds);
      buildingFeatures = Array.isArray(buildingData?.features) ? buildingData.features : [];
    } catch (error) {
      buildingLayerUnavailable = true;
      console.warn('[mapService] 建筑图层接口不可用:', error?.message || error);
      warnings.push('建筑图层暂不可用');
    }
  } else if (buildingLayerUnavailable) {
    warnings.push('建筑图层暂不可用');
  }

  let roadFeatures = [];
  if (shouldFetchRoads) {
    try {
      const roadData = await fetchRoadBuffers(roadBuffer);
      roadFeatures = Array.isArray(roadData?.features) ? roadData.features : [];
    } catch (error) {
      roadLayerUnavailable = true;
      console.warn('[mapService] 道路图层接口不可用:', error?.message || error);
      warnings.push('道路图层暂不可用');
    }
  } else if (roadLayerUnavailable) {
    warnings.push('道路图层暂不可用');
  }

  const buildings = buildingFeatures
    .flatMap((feature, featureIndex) => {
      const geometry = feature.geometry || feature.geom;
      const polygons = geometryToPolygons(geometry);
      return polygons.map((polygon, index) => ({
        id: `building-${feature.id || feature.gid || featureIndex}-${index}`,
        coordinates: polygon.coordinates,
        holes: polygon.holes,
      }));
    })
    .slice(0, buildingLimit);

  const roads = roadFeatures
    .flatMap((feature, featureIndex) => {
      const geometry = feature.geometry || feature.geom;
      const polygons = geometryToPolygons(geometry);
      return polygons.map((polygon, index) => ({
        id: `road-${feature.id || feature.gid || featureIndex}-${index}`,
        coordinates: polygon.coordinates,
        holes: polygon.holes,
      }));
    })
    .slice(0, roadLimit);

  const dataBounds = computeBoundsFromPolygons([...roads, ...buildings]);

  return {
    buildings,
    roads,
    bounds: dataBounds || null,
    warnings,
  };
};

export const buildRoute = async (start, end, { mode = 'custom' } = {}) => {
  if (!start || !end) {
    throw new Error('缺少路线的起点或终点');
  }

  try {
    const data = await fetchRoutePath({
      start: {
        latitude: start.latitude,
        longitude: start.longitude,
        name: start.name,
      },
      end: {
        latitude: end.latitude,
        longitude: end.longitude,
        name: end.name,
      },
      mode,
    });

    const parsed = parseRouteResponse(data, start, end);
    return ensureDistance({
      ...parsed,
      start,
      end,
    });
  } catch (error) {
    console.warn('[mapService] 路线规划失败，使用回退路线:', error);
    const route = fallbackRoute(start, end);
    return ensureDistance({
      ...route,
      start,
      end,
      info: {
        message: '使用简易路线（离线模式）',
      },
    });
  }
};

export const calculateRouteDistance = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 0;
  }

  return coordinates.reduce((distance, point, index) => {
    if (index === 0) return distance;
    return distance + calculateDistance(coordinates[index - 1], point);
  }, 0);
};

const estimateDuration = (distance) => {
  if (!isFinite(distance)) return null;
  const walkingSpeedMetersPerSecond = 1.35; // 约 4.86km/h，供校园步行参考
  return Math.round(distance / walkingSpeedMetersPerSecond);
};

export const formatDistance = (distance) => {
  if (!isFinite(distance)) return '未知距离';
  if (distance < 1000) return `${Math.round(distance)}米`;
  return `${(distance / 1000).toFixed(1)}公里`;
};

export const formatDuration = (seconds) => {
  if (!isFinite(seconds)) return '未知时间';
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}小时${remain}分钟` : `${hours}小时`;
};

export const processMarkerData = (marker) => {
  if (!marker) return null;

  const latitude = typeof marker.latitude === 'number' ? marker.latitude : marker?.coordinate?.latitude;
  const longitude = typeof marker.longitude === 'number' ? marker.longitude : marker?.coordinate?.longitude;

  return {
    title: marker.title || '建筑物',
    position:
      typeof latitude === 'number' && typeof longitude === 'number'
        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        : '未知位置',
    features: marker.features || marker.description || '暂无特点信息',
    description: marker.description,
    latitude,
    longitude,
    ...marker,
  };
};

