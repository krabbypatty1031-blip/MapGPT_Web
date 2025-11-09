/**
 * MapModal Web 版本
 * 使用 Google Maps JavaScript SDK 在 Web 平台渲染地图
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import MapDrawer from './MapDrawer';
import { useMap } from '../../hooks';
import { MAP_CONFIG } from '../../config/mapConfig';
import {
  MAP_MODAL_DIMENSIONS,
  MAP_ZOOM_LEVELS,
  POLYGON_STYLES,
  MARKER_STYLES,
  ROUTE_STYLES,
  MAP_LOADING_CONFIG,
} from '../../constants/mapConstants';

/**
 * MapModal 组件 - Web 版本
 * @param {boolean} visible - 模态框是否可见
 * @param {Function} onClose - 关闭回调
 * @param {Object} initialRegion - 初始地图区域
 * @param {Array} markers - 标记点数组
 * @param {number} chatInputHeight - 聊天输入框高度
 */
const MapModal = ({ visible, onClose, initialRegion, markers = [], chatInputHeight = 60 }) => {
  // ==================== Refs ====================
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polygonsRef = useRef([]);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const hasLoadedLayersRef = useRef(false);
  const lastLoadedRegionKeyRef = useRef(null);

  // ==================== State ====================
  const [isLoading, setIsLoading] = useState(false);

  // ==================== Hooks ====================
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
    fetchLocation,
    startNavigation,
    stopNavigation,
  } = useMap({
    markers,
    initialRegion,
    enableLocationTracking: false,
    useMockLocation: true,
  });

  // ==================== 计算属性 ====================
  const bottomDistance = useMemo(
    () =>
      chatInputHeight +
      MAP_MODAL_DIMENSIONS.QUICK_ACTIONS_HEIGHT +
      MAP_MODAL_DIMENSIONS.QUICK_ACTIONS_MARGIN +
      MAP_MODAL_DIMENSIONS.BOTTOM_TO_QUICK_ACTIONS,
    [chatInputHeight],
  );

  // ==================== Google Maps SDK ====================
  /**
   * 加载 Google Maps JavaScript SDK
   */
  const loadGoogleMapsScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      // 检查是否正在加载
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            resolve(window.google.maps);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Google Maps 加载超时'));
        }, MAP_LOADING_CONFIG.SDK_TIMEOUT);
        return;
      }

      // 创建并加载脚本
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_CONFIG.apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps API 未正确加载'));
        }
      };
      script.onerror = () => reject(new Error('Google Maps 脚本加载失败'));
      document.head.appendChild(script);
    });
  }, []);

  // ==================== 渲染方法 ====================
  /**
   * 渲染地图标记和多边形
   */
  const renderMarkers = useCallback(
    (map) => {
      if (!map || !window.google?.maps) return;

      // 清除旧标记
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // 清除旧多边形
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current = [];

      // 渲染道路多边形
      roadPolygons.forEach((polygon) => {
        if (!polygon.coordinates || polygon.coordinates.length < 3) return;

        const poly = new window.google.maps.Polygon({
          paths: polygon.coordinates.map((coord) => ({
            lat: coord.latitude,
            lng: coord.longitude,
          })),
          ...POLYGON_STYLES.ROAD,
          map,
        });

        polygonsRef.current.push(poly);
      });

      // 渲染建筑多边形
      buildingPolygons.forEach((polygon) => {
        if (!polygon.coordinates || polygon.coordinates.length < 3) return;

        const poly = new window.google.maps.Polygon({
          paths: polygon.coordinates.map((coord) => ({
            lat: coord.latitude,
            lng: coord.longitude,
          })),
          ...POLYGON_STYLES.BUILDING,
          map,
        });

        polygonsRef.current.push(poly);
      });

      // 渲染标记点
      markers.forEach((marker) => {
        const coordinate = marker.coordinate || {
          latitude: marker.latitude,
          longitude: marker.longitude,
        };

        if (!coordinate || !isFinite(coordinate.latitude) || !isFinite(coordinate.longitude)) {
          return;
        }

        const mapMarker = new window.google.maps.Marker({
          position: { lat: coordinate.latitude, lng: coordinate.longitude },
          map,
          title: marker.title || '',
          label: marker.title ? marker.title.charAt(0) : '',
          ...MARKER_STYLES.DEFAULT,
        });

        mapMarker.addListener('click', () => {
          handleMarkerPress(marker);
        });

        markersRef.current.push(mapMarker);
      });
    },
    [markers, buildingPolygons, roadPolygons, handleMarkerPress],
  );

  /**
   * 更新地图视口
   */
  const updateViewport = useCallback(
    (map) => {
      if (!map || !computedRegion) return;

      const center = {
        lat: computedRegion.latitude,
        lng: computedRegion.longitude,
      };

      map.setCenter(center);

      // 根据 latitudeDelta 计算合适的缩放级别
      const zoom = Math.round(Math.log2(360 / computedRegion.latitudeDelta));
      map.setZoom(
        Math.max(MAP_ZOOM_LEVELS.MIN, Math.min(zoom, MAP_ZOOM_LEVELS.MAX)),
      );
    },
    [computedRegion],
  );

  /**
   * 渲染路线
   */
  const renderRoute = useCallback(
    (map) => {
      if (!map || !window.google?.maps) return;

      // 清除旧路线
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      // 渲染新路线
      if (routeCoordinates.length > 1) {
        const path = routeCoordinates.map((coord) => ({
          lat: coord.latitude,
          lng: coord.longitude,
        }));

        polylineRef.current = new window.google.maps.Polyline({
          path,
          ...ROUTE_STYLES,
          map,
        });
      }
    },
    [routeCoordinates],
  );

  /**
   * 渲染用户位置和目的地标记
   */
  const renderLocationMarkers = useCallback(
    (map) => {
      if (!map || !window.google?.maps) return;

      // 清除旧的用户位置标记
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }

      // 清除旧的目的地标记
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }

      // 渲染用户位置
      if (userLocation) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map,
          title: '当前位置',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            ...MARKER_STYLES.USER_LOCATION,
          },
        });
      }

      // 渲染目的地
      if (destination) {
        destinationMarkerRef.current = new window.google.maps.Marker({
          position: { lat: destination.latitude, lng: destination.longitude },
          map,
          title: destination.name || '目的地',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            ...MARKER_STYLES.DESTINATION,
          },
        });
      }
    },
    [userLocation, destination],
  );

  /**
   * 初始化地图
   */
  const initialiseMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      // 加载 Google Maps SDK
      const maps = await loadGoogleMapsScript();

      // 只在首次创建地图实例时设置 loading
      if (!mapInstanceRef.current) {
        setIsLoading(true);

        // 创建地图实例
        const region = computedRegion || initialRegion || MAP_CONFIG.defaultCenter;
        mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
          center: { lat: region.latitude, lng: region.longitude },
          zoom: MAP_ZOOM_LEVELS.DEFAULT,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        // 加载位置
        const regionToLoad = initialRegion || MAP_CONFIG.defaultCenter;
        const regionKey = `${regionToLoad.latitude ?? ''}_${regionToLoad.longitude ?? ''}_${regionToLoad.latitudeDelta ?? ''}_${regionToLoad.longitudeDelta ?? ''}`;

        if (!hasLoadedLayersRef.current || lastLoadedRegionKeyRef.current !== regionKey) {
          await fetchLocation();
          hasLoadedLayersRef.current = true;
          lastLoadedRegionKeyRef.current = regionKey;
        }

        setIsLoading(false);
      }

      // 更新地图内容
      if (mapInstanceRef.current) {
        renderMarkers(mapInstanceRef.current);
        renderRoute(mapInstanceRef.current);
        renderLocationMarkers(mapInstanceRef.current);
        updateViewport(mapInstanceRef.current);
      }
    } catch (error) {
      console.error('[MapModal.web] 地图初始化失败:', error);
      setIsLoading(false);
    }
  }, [
    loadGoogleMapsScript,
    computedRegion,
    initialRegion,
    fetchLocation,
    renderMarkers,
    renderRoute,
    renderLocationMarkers,
    updateViewport,
  ]);

  // ==================== Effects ====================
  /**
   * 当模态框可见时初始化地图
   */
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        initialiseMap();
      }, MAP_LOADING_CONFIG.INIT_DELAY);
      return () => clearTimeout(timer);
    } else {
      // 关闭时清理所有状态和引用
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current = [];

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }

      if (mapInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }

      hasLoadedLayersRef.current = false;
      lastLoadedRegionKeyRef.current = null;

      stopNavigation();
    }
  }, [visible, initialiseMap, stopNavigation]);

  /**
   * 更新标记和多边形
   */
  useEffect(() => {
    if (visible && mapInstanceRef.current) {
      renderMarkers(mapInstanceRef.current);
    }
  }, [visible, markers, buildingPolygons, roadPolygons, renderMarkers]);

  /**
   * 更新路线
   */
  useEffect(() => {
    if (visible && mapInstanceRef.current) {
      renderRoute(mapInstanceRef.current);
    }
  }, [visible, routeCoordinates, renderRoute]);

  /**
   * 更新用户位置和目的地标记
   */
  useEffect(() => {
    if (visible && mapInstanceRef.current) {
      renderLocationMarkers(mapInstanceRef.current);
    }
  }, [visible, userLocation, destination, renderLocationMarkers]);

  /**
   * 更新视口
   */
  useEffect(() => {
    if (visible && mapInstanceRef.current && computedRegion) {
      updateViewport(mapInstanceRef.current);
    }
  }, [visible, computedRegion, updateViewport]);

  // ==================== 事件处理器 ====================
  /**
   * 关闭处理
   */
  const handleClose = () => {
    stopNavigation();
    onClose();
  };

  /**
   * 开始导航处理
   */
  const handleStartNavigation = async (target = null) => {
    if (!destination && !target) return;

    try {
      await startNavigation(target || destination);
      handleDrawerClose();
    } catch (error) {
      console.warn('[MapModal.web] 导航启动失败:', error?.message || error);
    }
  };

  // ==================== 渲染 ====================
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              top: MAP_MODAL_DIMENSIONS.HEADER_HEIGHT,
              bottom: bottomDistance,
            },
          ]}
        >
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* 地图容器 */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          />

          {/* 控制按钮 */}
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
              style={[
                styles.controlButton,
                (!destination || routeLoading) && styles.controlButtonDisabled,
              ]}
              disabled={!destination || routeLoading}
              onPress={() => handleStartNavigation()}
            >
              <Text style={styles.controlButtonText}>
                {isNavigating ? '更新导航' : '开始导航'}
              </Text>
            </TouchableOpacity>

            {isNavigating && (
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={stopNavigation}
              >
                <Text style={styles.controlButtonText}>结束导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 路线信息 */}
          {(routeSummary || routeError) && (
            <View style={styles.routeInfoContainer}>
              {routeSummary && (
                <>
                  <Text style={styles.routeInfoText}>距离：{routeSummary.distanceText}</Text>
                  <Text style={styles.routeInfoText}>预计耗时：{routeSummary.durationText}</Text>
                  {routeSummary.note && (
                    <Text style={styles.routeInfoText}>提示：{routeSummary.note}</Text>
                  )}
                </>
              )}
              {routeError && <Text style={[styles.routeInfoText, styles.errorText]}>{routeError}</Text>}
            </View>
          )}

          {/* 错误提示 */}
          {(locationError || layersError) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{locationError || layersError}</Text>
            </View>
          )}

          {/* 建筑信息抽屉 */}
          {drawerVisible && selectedBuilding && (
            <MapDrawer
              visible={drawerVisible}
              buildingInfo={selectedBuilding}
              onClose={handleDrawerClose}
              onNavigate={async (target) => {
                if (!target?.latitude || !target?.longitude) return;
                await handleStartNavigation({
                  latitude: target.latitude,
                  longitude: target.longitude,
                  name: target.title || target.name,
                });
              }}
            />
          )}

          {/* 加载指示器 */}
          {(isLoading || layersLoading || routeLoading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ==================== 样式 ====================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    width: MAP_MODAL_DIMENSIONS.WIDTH,
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
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    lineHeight: 18,
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
  errorText: {
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
