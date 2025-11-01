import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, Circle } from 'react-native-maps';
import MapDrawer from './MapDrawer';
import { useMap } from '../../hooks';
import { MAP_CONFIG } from '../../config/mapConfig';

const MAP_WIDTH = 355;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
const QUICK_ACTIONS_HEIGHT = 33;
const QUICK_ACTIONS_MARGIN = 28;
const BOTTOM_TO_QUICK_ACTIONS = 20;

const MapModal = ({ visible, onClose, initialRegion, markers = [], chatInputHeight = 60 }) => {
  const mapRef = useRef(null);
  const hasLoadedLayersRef = useRef(false);
  const lastLoadedRegionKeyRef = useRef(null);

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
    handleMapReady,
    handleMapError,
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

  useEffect(() => {
    if (visible) {
      const regionToLoad = initialRegion || MAP_CONFIG.defaultCenter;
      const regionKey = `${regionToLoad.latitude ?? ''}_${regionToLoad.longitude ?? ''}_${regionToLoad.latitudeDelta ?? ''}_${regionToLoad.longitudeDelta ?? ''}`;

      if (!hasLoadedLayersRef.current || lastLoadedRegionKeyRef.current !== regionKey) {
        loadLayers(regionToLoad);
        fetchLocation();
        hasLoadedLayersRef.current = true;
        lastLoadedRegionKeyRef.current = regionKey;
      }
    } else {
      hasLoadedLayersRef.current = false;
      lastLoadedRegionKeyRef.current = null;
      stopNavigation();
    }
  }, [visible, initialRegion, loadLayers, fetchLocation, stopNavigation]);

  useEffect(() => {
    if (visible && mapRef.current && computedRegion) {
      try {
        mapRef.current.animateToRegion(computedRegion, 360);
      } catch (error) {
        console.warn('[MapModal] animateToRegion 失败:', error);
      }
    }
  }, [visible, computedRegion]);

  useEffect(() => {
    if (!visible || !mapRef.current) return;
    if (routeCoordinates.length < 2) return;

    try {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 120, right: 72, bottom: 240, left: 72 },
        animated: true,
      });
    } catch (error) {
      console.warn('[MapModal] fitToCoordinates 失败:', error);
    }
  }, [visible, routeCoordinates]);

  const handleClose = () => {
    stopNavigation();
    onClose();
  };

  const handleStartNavigation = async () => {
    if (!destination) {
      return;
    }

    try {
      await startNavigation(destination);
    } catch (error) {
      console.warn('[MapModal] 导航启动失败:', error?.message || error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
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

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={computedRegion || initialRegion || MAP_CONFIG.defaultCenter}
            showsMyLocationButton={false}
            showsCompass={false}
            showsIndoors={false}
            showsTraffic={false}
            showsBuildings
            zoomEnabled
            scrollEnabled
            rotateEnabled={false}
            pitchEnabled={false}
            onMapReady={handleMapReady}
            onMapError={handleMapError}
          >
            {roadPolygons.map((polygon) => (
              <Polygon
                key={polygon.id}
                coordinates={polygon.coordinates}
                holes={polygon.holes}
                strokeColor="rgba(120,120,120,0.85)"
                strokeWidth={2}
                fillColor="rgba(160,160,160,0.35)"
                zIndex={1}
              />
            ))}

            {buildingPolygons.map((polygon) => (
              <Polygon
                key={polygon.id}
                coordinates={polygon.coordinates}
                holes={polygon.holes}
                strokeColor="rgba(255,140,0,0.9)"
                strokeWidth={2}
                fillColor="rgba(255,165,0,0.35)"
                zIndex={2}
              />
            ))}

            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#007AFF"
                strokeWidth={5}
                zIndex={3}
              />
            )}

            {markers.map((marker, idx) => {
              const coordinate = marker.coordinate || {
                latitude: marker.latitude,
                longitude: marker.longitude,
              };
              if (
                !coordinate ||
                !isFinite(coordinate.latitude) ||
                !isFinite(coordinate.longitude)
              ) {
                return null;
              }

              return (
                <Marker
                  key={marker.id || `marker-${idx}`}
                  coordinate={coordinate}
                  title={marker.title}
                  description={marker.description}
                  onPress={() => handleMarkerPress(marker)}
                />
              );
            })}

            {destination && (
              <Marker
                coordinate={{
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                }}
                title={destination.name || '目的地'}
                pinColor="#FF3B30"
              />
            )}

            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="当前位置"
                pinColor="#007AFF"
              />
            )}

            {userLocation?.accuracy && (
              <Circle
                center={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                radius={userLocation.accuracy}
                fillColor="rgba(0,122,255,0.1)"
                strokeColor="rgba(0,122,255,0.2)"
              />
            )}
          </MapView>

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
                  {routeSummary.note && (
                    <Text style={styles.routeInfoText}>提示：{routeSummary.note}</Text>
                  )}
                </>
              )}
              {routeError && <Text style={[styles.routeInfoText, styles.errorText]}>{routeError}</Text>}
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

          {(layersLoading || routeLoading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
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
    alignItems: 'center', // 居中对齐
  },
  modalContainer: {
    position: 'absolute',
    width: MAP_WIDTH, // 固定宽度 355px
    // top 和 bottom 通过 inline style 动态设置
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // 四个角都是 16px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
  map: {
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 40,
  },
});

export default MapModal;
