import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MAP_CONFIG } from '../config/mapConfig';
import {
  loadMapLayers,
  processMarkerData,
  formatDistance,
  formatDuration,
} from '../services/mapService';
import { useLocation } from './useLocation';
import { useNavigation } from './useNavigation';

export const useMap = (options = {}) => {
  const {
    markers = [],
    initialRegion,
    onOpen,
    enableLocationTracking = false,
    useMockLocation = false,
  } = options;

  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingPolygons, setBuildingPolygons] = useState([]);
  const [roadPolygons, setRoadPolygons] = useState([]);
  const [layersLoading, setLayersLoading] = useState(false);
  const [layersError, setLayersError] = useState(null);
  const [destination, setDestination] = useState(null);

  const lastMarkerPressRef = useRef(0);
  const navigationTimerRef = useRef(null);

  const {
    userLocation,
    loading: locationLoading,
    error: locationError,
    fetchLocation,
    clearLocation,
  } = useLocation(enableLocationTracking, useMockLocation);

  const {
    currentRoute,
    isNavigating,
    routeLoading,
    routeError,
    startNavigation: startRoute,
    updateRoute,
    stopNavigation: stopRoute,
  } = useNavigation();

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    setHasError(false);
  }, []);

  const handleMapError = useCallback((error) => {
    console.error('[useMap] 地图加载错误:', error);
    setHasError(true);
    setMapReady(true);
  }, []);

  const handleMarkerPress = useCallback(
    (marker) => {
      const now = Date.now();
      if (now - lastMarkerPressRef.current < 400) {
        return;
      }

      lastMarkerPressRef.current = now;
      const processed = processMarkerData(marker);
      setSelectedBuilding(processed);
      setDrawerVisible(true);

      if (
        processed?.latitude !== undefined &&
        processed?.longitude !== undefined &&
        (destination === null || destination?.auto)
      ) {
        setDestination((prev) =>
          prev || {
            latitude: processed.latitude,
            longitude: processed.longitude,
            name: processed.title,
            source: 'marker',
          },
        );
      }
    },
    [destination],
  );

  const handleDrawerClose = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const ensureLocation = useCallback(async () => {
    if (userLocation) {
      return userLocation;
    }
    return fetchLocation();
  }, [userLocation, fetchLocation]);

  const startNavigation = useCallback(
    async (target) => {
      const targetPoint = target || destination;
      if (!targetPoint) {
        throw new Error('缺少导航目标');
      }

      const start = await ensureLocation();
      if (!start) {
        throw new Error('无法获取当前位置');
      }

      const route = await startRoute(start, targetPoint);
      if (!route) {
        return null;
      }

      setDestination({ ...targetPoint, auto: false });

      if (navigationTimerRef.current) {
        clearInterval(navigationTimerRef.current);
      }

      navigationTimerRef.current = setInterval(async () => {
        const updatedLocation = await fetchLocation({ silent: true });
        if (!updatedLocation) {
          return;
        }
        await updateRoute(updatedLocation, targetPoint, { silent: true });
      }, 5000);

      return route;
    },
    [destination, ensureLocation, startRoute, fetchLocation, updateRoute],
  );

  const stopNavigation = useCallback(() => {
    if (navigationTimerRef.current) {
      clearInterval(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    stopRoute();
  }, [stopRoute]);

  const loadLayers = useCallback(
    async (region) => {
      setLayersLoading(true);

      try {
        const result = await loadMapLayers({ region });
        setBuildingPolygons(result.buildings || []);
        setRoadPolygons(result.roads || []);

        if (Array.isArray(result.warnings) && result.warnings.length > 0) {
          setLayersError(result.warnings.join('；'));
        } else {
          setLayersError(null);
        }

        if (!destination && result.bounds) {
          const centerLat = (result.bounds.sw.latitude + result.bounds.ne.latitude) / 2;
          const centerLon = (result.bounds.sw.longitude + result.bounds.ne.longitude) / 2;

          setDestination({
            latitude: centerLat,
            longitude: centerLon,
            name: '地图中心',
            auto: true,
          });
        }

        return result;
      } catch (error) {
        const message = error?.message || '图层数据加载失败';
        setLayersError(message);
        console.warn('[useMap] 图层加载失败:', message);
        return null;
      } finally {
        setLayersLoading(false);
      }
    },
    [destination],
  );

  useEffect(() => () => stopNavigation(), [stopNavigation]);

  useEffect(() => {
    if (onOpen) {
      onOpen();
    }
  }, [onOpen]);

  const computedRegion = useMemo(() => {
    const targets = [];

    markers.forEach((marker) => {
      const coordinate = marker.coordinate || {
        latitude: marker.latitude,
        longitude: marker.longitude,
      };
      if (
        coordinate &&
        isFinite(coordinate.latitude) &&
        isFinite(coordinate.longitude)
      ) {
        targets.push(coordinate);
      }
    });

    if (userLocation) {
      targets.push(userLocation);
    }

    if (destination) {
      targets.push({ latitude: destination.latitude, longitude: destination.longitude });
    }

    const baseRegion = initialRegion || MAP_CONFIG.defaultCenter;

    if (targets.length === 0) {
      return baseRegion;
    }

    const latitudes = targets.map((item) => item.latitude);
    const longitudes = targets.map((item) => item.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const latitudeDelta = Math.max((maxLat - minLat) * 1.3, baseRegion.latitudeDelta || 0.01);
    const longitudeDelta = Math.max((maxLon - minLon) * 1.3, baseRegion.longitudeDelta || 0.01);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta,
      longitudeDelta,
    };
  }, [markers, userLocation, destination, initialRegion]);

  const routeCoordinates = currentRoute?.coordinates || [];
  const routeInfo = currentRoute?.info || null;

  const routeSummary = useMemo(() => {
    if (!routeInfo) {
      return null;
    }
    return {
      distanceText: formatDistance(routeInfo.distance),
      durationText: formatDuration(routeInfo.duration),
      note: routeInfo.note,
    };
  }, [routeInfo]);

  const resetMapState = useCallback(() => {
    setMapReady(false);
    setHasError(false);
    setDrawerVisible(false);
    setSelectedBuilding(null);
    setBuildingPolygons([]);
    setRoadPolygons([]);
    setLayersError(null);
    setDestination(null);
    stopNavigation();
    clearLocation();
  }, [stopNavigation, clearLocation]);

  return {
    mapReady,
    hasError,
    drawerVisible,
    selectedBuilding,
    buildingPolygons,
    roadPolygons,
    layersLoading,
    layersError,
    destination,
    setDestination,
    userLocation,
    locationLoading,
    locationError,
    routeCoordinates,
    routeInfo,
    routeSummary,
    routeLoading,
    routeError,
    isNavigating,
    computedRegion,
    handleMapReady,
    handleMapError,
    handleMarkerPress,
    handleDrawerClose,
    loadLayers,
    fetchLocation,
    startNavigation,
    stopNavigation,
    resetMapState,
  };
};
