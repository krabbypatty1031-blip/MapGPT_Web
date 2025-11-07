import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapDrawer from './MapDrawer';
import { useMap } from '../../hooks';
import { MAP_CONFIG } from '../../config/mapConfig';

const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
const QUICK_ACTIONS_HEIGHT = 33;
const QUICK_ACTIONS_MARGIN = 28;
const BOTTOM_TO_QUICK_ACTIONS = 20;
const MAP_WIDTH = 355;

let googleMapsLoader = null;

/**
 * 异步加载 Google Maps JS SDK
 * @returns {Promise<typeof google.maps>} 已加载的 Google Maps 对象
 */
const ensureGoogleMaps = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps 仅在浏览器环境可用'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsLoader) {
    googleMapsLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps]');

      const handleLoaded = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps SDK 未正确初始化'));
        }
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleLoaded, { once: true });
        existingScript.addEventListener('error', (event) => {
          reject(new Error(event?.message || 'Google Maps SDK 加载失败'));
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_CONFIG.apiKey}&libraries=geometry`;
      script.defer = true;
      script.async = true;
      script.dataset.googleMaps = 'true';
      script.addEventListener('load', handleLoaded, { once: true });
      script.addEventListener('error', (event) => {
        reject(new Error(event?.message || 'Google Maps SDK 加载失败'));
      }, { once: true });
      document.body.appendChild(script);
    });
  }

  return googleMapsLoader;
};

/**
 * 将 React Native 的坐标转换为 Google Maps LatLng
 * @param {{ latitude: number, longitude: number }} coordinate 坐标对象
 * @returns {{ lat: number, lng: number }} Google Maps 坐标
 */
const toGoogleLatLng = (coordinate) => ({
  lat: coordinate.latitude,
  lng: coordinate.longitude,
});

/**
 * 根据显示范围估算地图缩放等级
 * @param {{ latitudeDelta?: number }} region 区域对象
 * @returns {number} Google Maps 缩放等级
 */
const inferZoomFromRegion = (region) => {
  const latitudeDelta = region?.latitudeDelta ?? 0.01;
  const zoomLevel = Math.log2(360 / latitudeDelta);
  return Math.min(Math.max(Math.round(zoomLevel), 3), 20);
};

/**
 * Web 端地图弹窗
 * 使用 Google Maps JS 实现交互功能
 */
const MapModal = ({
  visible,
  onClose,
  initialRegion,
  markers = [],
  chatInputHeight = 60,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlaysRef = useRef({
    markers: [],
    buildingPolygons: [],
    roadPolygons: [],
    routePolyline: null,
    destinationMarker: null,
    userMarker: null,
    accuracyCircle: null,
  });

  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    drawerVisible,
    selectedBuilding,
    buildingPolygons,
    roadPolygons,
    layersLoading,
    layersError,
    destination,
    userLocation,
    locationLoading,
    locationError,
    routeCoordinates,
    routeSummary,
    routeLoading,
    routeError,
    isNavigating,
    computedRegion,
    handleMarkerPress,
    handleDrawerClose,
    loadLayers,
    fetchLocation,
    startNavigation,
    stopNavigation,
  } = useMap({
    markers,
    initialRegion,
    enableLocationTracking: false,
    useMockLocation: false,
  });

  const bottomDistance = useMemo(
    () => chatInputHeight + QUICK_ACTIONS_HEIGHT + QUICK_ACTIONS_MARGIN + BOTTOM_TO_QUICK_ACTIONS,
    [chatInputHeight],
  );

  /**
   * 清理地图上的所有覆盖物
   */
  const clearOverlays = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    overlaysRef.current.markers.forEach((marker) => marker.setMap(null));
    overlaysRef.current.buildingPolygons.forEach((polygon) => polygon.setMap(null));
    overlaysRef.current.roadPolygons.forEach((polygon) => polygon.setMap(null));

    overlaysRef.current.markers = [];
    overlaysRef.current.buildingPolygons = [];
    overlaysRef.current.roadPolygons = [];

    if (overlaysRef.current.routePolyline) {
      overlaysRef.current.routePolyline.setMap(null);
      overlaysRef.current.routePolyline = null;
    }
    if (overlaysRef.current.destinationMarker) {
      overlaysRef.current.destinationMarker.setMap(null);
      overlaysRef.current.destinationMarker = null;
    }
    if (overlaysRef.current.userMarker) {
      overlaysRef.current.userMarker.setMap(null);
      overlaysRef.current.userMarker = null;
    }
    if (overlaysRef.current.accuracyCircle) {
      overlaysRef.current.accuracyCircle.setMap(null);
      overlaysRef.current.accuracyCircle = null;
    }
  }, []);

  /**
   * 渲染地图标记
   * @param {google.maps.Map} map Google 地图实例
   */
  const renderMarkers = useCallback((map) => {
    clearOverlays();

    const google = window.google;
    if (!google?.maps) {
      return;
    }

    // Render campus markers
    const googleMarkers = markers
      .map((marker, index) => {
        const coordinate = marker.coordinate || {
          latitude: marker.latitude,
          longitude: marker.longitude,
        };

        if (!coordinate || !isFinite(coordinate.latitude) || !isFinite(coordinate.longitude)) {
          return null;
        }

        const googleMarker = new google.maps.Marker({
          map,
          position: toGoogleLatLng(coordinate),
          title: marker.title,
        });

        googleMarker.addListener('click', () => handleMarkerPress(marker));
        return googleMarker;
      })
      .filter(Boolean);

    overlaysRef.current.markers = googleMarkers;

    // Render campus road polygons
    overlaysRef.current.roadPolygons = roadPolygons.map((polygon) => {
      const paths = polygon.coordinates.map(toGoogleLatLng);
      const holes = (polygon.holes || []).map((hole) => hole.map(toGoogleLatLng));

      const googlePolygon = new google.maps.Polygon({
        map,
        paths: [paths, ...holes],
        strokeColor: 'rgba(120,120,120,0.85)',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: 'rgba(160,160,160,0.35)',
        fillOpacity: 0.35,
      });

      return googlePolygon;
    });

    // Render building polygons
    overlaysRef.current.buildingPolygons = buildingPolygons.map((polygon) => {
      const paths = polygon.coordinates.map(toGoogleLatLng);
      const holes = (polygon.holes || []).map((hole) => hole.map(toGoogleLatLng));

      const googlePolygon = new google.maps.Polygon({
        map,
        paths: [paths, ...holes],
        strokeColor: 'rgba(255,140,0,0.9)',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: 'rgba(255,165,0,0.35)',
        fillOpacity: 0.35,
      });

      return googlePolygon;
    });

    // Render route polyline
    if (Array.isArray(routeCoordinates) && routeCoordinates.length > 1) {
      overlaysRef.current.routePolyline = new google.maps.Polyline({
        map,
        path: routeCoordinates.map(toGoogleLatLng),
        strokeColor: '#007AFF',
        strokeWeight: 5,
      });
    }

    if (destination) {
      overlaysRef.current.destinationMarker = new google.maps.Marker({
        map,
        position: toGoogleLatLng(destination),
        title: destination.name || '目的地',
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 4,
          fillColor: '#FF3B30',
          fillOpacity: 0.95,
          strokeWeight: 1,
          strokeColor: '#D92D20',
        },
      });
    }

    if (userLocation) {
      overlaysRef.current.userMarker = new google.maps.Marker({
        map,
        position: toGoogleLatLng(userLocation),
        title: '当前位置',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#007AFF',
          fillOpacity: 0.95,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      });

      if (isFinite(userLocation.accuracy)) {
        overlaysRef.current.accuracyCircle = new google.maps.Circle({
          map,
          center: toGoogleLatLng(userLocation),
          radius: userLocation.accuracy,
          strokeColor: 'rgba(0,122,255,0.2)',
          strokeOpacity: 0.2,
          strokeWeight: 1,
          fillColor: 'rgba(0,122,255,0.1)',
          fillOpacity: 0.1,
        });
      }
    }
  }, [markers, roadPolygons, buildingPolygons, routeCoordinates, destination, userLocation, handleMarkerPress, clearOverlays]);

  /**
   * 更新地图可视区域
   * @param {google.maps.Map} map Google 地图实例
   */
  const updateViewport = useCallback((map) => {
    const google = window.google;
    if (!google?.maps) {
      return;
    }

    const points = [];

    if (Array.isArray(markers)) {
      markers.forEach((marker) => {
        const coordinate = marker.coordinate || {
          latitude: marker.latitude,
          longitude: marker.longitude,
        };
        if (coordinate && isFinite(coordinate.latitude) && isFinite(coordinate.longitude)) {
          points.push(coordinate);
        }
      });
    }

    if (Array.isArray(routeCoordinates)) {
      routeCoordinates.forEach((point) => {
        if (point && isFinite(point.latitude) && isFinite(point.longitude)) {
          points.push(point);
        }
      });
    }

    if (destination) {
      points.push(destination);
    }

    if (userLocation) {
      points.push(userLocation);
    }

    if (points.length === 0) {
      const region = computedRegion || initialRegion || MAP_CONFIG.defaultCenter;
      map.setCenter(toGoogleLatLng(region));
      map.setZoom(inferZoomFromRegion(region));
      return;
    }

    if (points.length === 1) {
      map.setCenter(toGoogleLatLng(points[0]));
      map.setZoom(18);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(new google.maps.LatLng(point.latitude, point.longitude)));
    map.fitBounds(bounds, 48);
  }, [markers, routeCoordinates, destination, userLocation, computedRegion, initialRegion]);

  /**
   * 初始化并渲染地图
   */
  const initialiseMap = useCallback(async () => {
    if (!visible) {
      return;
    }

    setIsLoading(true);

    try {
      const maps = await ensureGoogleMaps();
      setMapError(null);

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const region = computedRegion || initialRegion || MAP_CONFIG.defaultCenter;
        mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
          center: toGoogleLatLng(region),
          zoom: inferZoomFromRegion(region),
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        });
      }

      if (mapInstanceRef.current) {
        renderMarkers(mapInstanceRef.current);
        updateViewport(mapInstanceRef.current);
      }

      const regionToLoad = initialRegion || MAP_CONFIG.defaultCenter;
      await loadLayers(regionToLoad);

      try {
        await fetchLocation({ silent: true });
      } catch (error) {
        console.warn('[MapModal.web] 定位失败（忽略错误继续展示地图）:', error);
      }
    } catch (error) {
      console.error('[MapModal.web] 地图初始化失败:', error);
      setMapError(error?.message || '地图加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [visible, computedRegion, initialRegion, renderMarkers, updateViewport, loadLayers, fetchLocation]);

  useEffect(() => {
    if (visible) {
      initialiseMap();
    }

    return () => {
      if (!visible && mapInstanceRef.current) {
        clearOverlays();
      }
    };
  }, [visible, initialiseMap, clearOverlays]);

  useEffect(() => {
    if (!visible || !mapInstanceRef.current || mapError) {
      return;
    }
    renderMarkers(mapInstanceRef.current);
    updateViewport(mapInstanceRef.current);
  }, [visible, markers, roadPolygons, buildingPolygons, routeCoordinates, destination, userLocation, mapError, renderMarkers, updateViewport]);

  const handleClose = useCallback(() => {
    stopNavigation();
    onClose();
  }, [onClose, stopNavigation]);

  const handleStartNavigation = useCallback(async () => {
    if (!destination) {
      return;
    }
    try {
      await startNavigation(destination);
    } catch (error) {
      console.warn('[MapModal.web] 导航启动失败:', error);
    }
  }, [destination, startNavigation]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              top: HEADER_HEIGHT,
              bottom: bottomDistance,
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.map}>
            <View ref={mapContainerRef} style={styles.mapCanvas} />

            {(isLoading || layersLoading || routeLoading) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {mapError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{mapError}</Text>
              </View>
            )}
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, locationLoading && styles.controlButtonDisabled]}
              disabled={locationLoading}
              onPress={() => fetchLocation()}
            >
              <Text style={styles.controlButtonText}>
                {locationLoading ? '定位中...' : '更新定位'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, (!destination || routeLoading) && styles.controlButtonDisabled]}
              disabled={!destination || routeLoading}
              onPress={handleStartNavigation}
            >
              <Text style={styles.controlButtonText}>
                {isNavigating ? '更新导航' : '开始导航'}
              </Text>
            </TouchableOpacity>

            {isNavigating && (
              <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopNavigation}>
                <Text style={styles.controlButtonText}>结束导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {(routeSummary || routeError) && (
            <View style={styles.routeInfoContainer}>
              {routeSummary && (
                <>
                  <Text style={styles.routeInfoText}>距离：{routeSummary.distanceText}</Text>
                  <Text style={styles.routeInfoText}>预计耗时：{routeSummary.durationText}</Text>
                  {routeSummary.note && <Text style={styles.routeInfoText}>提示：{routeSummary.note}</Text>}
                </>
              )}
              {routeError && <Text style={[styles.routeInfoText, styles.routeErrorText]}>{routeError}</Text>}
            </View>
          )}

          {(locationError || layersError) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{locationError || layersError}</Text>
            </View>
          )}

          {drawerVisible && selectedBuilding && (
            <MapDrawer
              visible={drawerVisible}
              buildingInfo={selectedBuilding}
              onClose={handleDrawerClose}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    width: MAP_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    lineHeight: 18,
  },
  map: {
    flex: 1,
  },
  mapCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 20,
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.45)',
  },
  stopButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 16,
    zIndex: 30,
  },
  routeInfoText: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 4,
  },
  routeErrorText: {
    color: '#FFCDD2',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(214, 45, 32, 0.85)',
    borderRadius: 12,
    zIndex: 25,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 40,
  },
});

export default MapModal;


