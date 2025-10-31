import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapDrawer from './MapDrawer';
import { MAP_CONFIG } from '../../config/mapConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 地图弹窗宽度（设计稿要求）
const MAP_WIDTH = 355;
// 计算Header的高度 (状态栏 + Header内容)
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
// QuickActions 的高度：按钮33px + chatInputHeight动态值 + 上下间距(28px bottom + 一些padding)
// 底部到 QuickActions 上边缘的距离
const BOTTOM_TO_QUICK_ACTIONS = 20; // 地图底部距离 QuickActions 上边缘的小间距

/**
 * 地图弹出窗组件 - 带候选点的版本
 * 显示谷歌地图，支持拖动和缩放，显示候选点标记
 * @param {boolean} visible - 是否显示弹窗
 * @param {Function} onClose - 关闭弹窗的回调
 * @param {Object} initialRegion - 地图初始区域
 * @param {Array} markers - 地图标记点数组
 * @param {number} chatInputHeight - ChatInput组件的高度，用于动态调整位置
 */
const MapModal = ({ visible, onClose, initialRegion, markers = [], chatInputHeight = 60 }) => {
  const mapRef = useRef(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // 计算底部距离：ChatInput高度 + QuickActions高度(33px) + 间距(28px bottom + 5px gap)
  const bottomDistance = chatInputHeight + 33 + 28 + BOTTOM_TO_QUICK_ACTIONS;

  // 默认区域（香港浸会大学）
  const defaultRegion = MAP_CONFIG.defaultCenter;
  // 计算以所有候选点为中心的区域（如果有候选点）
  const centerRegion = useMemo(() => {
    if (markers && markers.length > 0) {
      // 收集所有有效坐标
      const coords = markers.map(m => m.coordinate || { latitude: m.latitude, longitude: m.longitude })
        .filter(c => c && typeof c.latitude === 'number' && typeof c.longitude === 'number');

      if (coords.length === 0) return initialRegion || defaultRegion;

      const latSum = coords.reduce((s, c) => s + c.latitude, 0);
      const lngSum = coords.reduce((s, c) => s + c.longitude, 0);
      const avgLat = latSum / coords.length;
      const avgLng = lngSum / coords.length;

      // 计算跨度（简单算法：基于经纬差的最大值，带一点padding）
      const latVals = coords.map(c => c.latitude);
      const lngVals = coords.map(c => c.longitude);
      const latRange = Math.max(...latVals) - Math.min(...latVals);
      const lngRange = Math.max(...lngVals) - Math.min(...lngVals);
      const paddingFactor = 1.3; // 放大以避免marker紧贴边缘
      const latitudeDelta = Math.max((latRange || 0.005) * paddingFactor, defaultRegion.latitudeDelta);
      const longitudeDelta = Math.max((lngRange || 0.005) * paddingFactor, defaultRegion.longitudeDelta);

      return {
        latitude: avgLat,
        longitude: avgLng,
        latitudeDelta,
        longitudeDelta,
      };
    }

    return initialRegion || defaultRegion;
  }, [markers, initialRegion]);

  // 当 visible 或 markers 变化时，将地图移动到计算好的中心位置
  useEffect(() => {
    if (visible && mapRef.current && centerRegion) {
      try {
        mapRef.current.animateToRegion(centerRegion, 300);
      } catch (e) {
        // some platforms may throw if animateToRegion called too early
        console.warn('[MapModal] animateToRegion failed:', e);
      }
    }
  }, [visible, centerRegion]);

  // 处理关闭
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* 地图容器 - 宽度355px，居中显示 */}
        <View style={[
          styles.modalContainer,
          {
            top: HEADER_HEIGHT,
            bottom: bottomDistance,
          }
        ]}>
          {/* 关闭按钮 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* 地图视图 - 带候选点的实现 */}
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={centerRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
            onMapReady={() => {
              console.log('✅ 地图加载完成，centerRegion:', centerRegion);
            }}
            onMapError={(error) => {
              console.error('❌ 地图加载错误:', error);
            }}
          >
            {/* 渲染候选点 */}
            {markers && markers.map((marker, idx) => {
              const coordinate = marker.coordinate || { latitude: marker.latitude, longitude: marker.longitude };
              if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') return null;

              return (
                <Marker
                  key={marker.id || `m-${idx}`}
                  coordinate={coordinate}
                  title={marker.title}
                  description={marker.description}
                  onPress={() => {
                    console.log('Marker clicked:', marker);
                    const buildingData = {
                      title: marker.title,
                      position: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
                      description: marker.description,
                      features: marker.type || '地点',
                      ...marker,
                    };
                    console.log('Setting selectedBuilding:', buildingData);
                    setSelectedBuilding(buildingData);
                    setDrawerVisible(true);
                    console.log('Drawer should now be visible');
                  }}
                />
              );
            })}
          </MapView>

          {/* 地图底部抽屉 */}
          {drawerVisible && selectedBuilding && (
            <MapDrawer
              visible={drawerVisible}
              buildingInfo={selectedBuilding}
              onClose={() => {
                console.log('Drawer onClose called');
                setDrawerVisible(false);
                setSelectedBuilding(null);
              }}
            />
          )}
          {console.log('Drawer render check:', { drawerVisible, selectedBuilding })}
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
});

export default MapModal;
