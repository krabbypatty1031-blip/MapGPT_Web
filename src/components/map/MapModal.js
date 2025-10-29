import React, { useState, useRef, useEffect } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { theme } from '../../constants/theme';
import { MAP_CONFIG } from '../../config/mapConfig';
import MapDrawer from './MapDrawer';
import RouteDrawer from './RouteDrawer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 地图弹窗宽度（设计稿要求）
const MAP_WIDTH = 390;
// 计算Header的高度 (状态栏 + Header内容)
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
// QuickActions 的高度：按钮33px + chatInputHeight动态值 + 上下间距(28px bottom + 一些padding)
// 底部到 QuickActions 上边缘的距离
const BOTTOM_TO_QUICK_ACTIONS = 20; // 地图底部距离 QuickActions 上边缘的小间距

/**
 * 地图弹出窗组件
 * @param {boolean} visible - 是否显示弹窗
 * @param {Function} onClose - 关闭弹窗的回调
 * @param {Object} initialRegion - 地图初始区域
 * @param {Array} markers - 地图标记点数组
 * @param {number} chatInputHeight - ChatInput组件的高度，用于动态调整位置
 */
const MapModal = ({ visible, onClose, initialRegion, markers = [], chatInputHeight = 60 }) => {
  const mapRef = useRef(null);
  const webViewRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [routeDrawerVisible, setRouteDrawerVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // 用户当前位置

  // 使用配置中的地图提供商
  const useWebView = MAP_CONFIG.provider === 'webview';

  // 计算底部距离：ChatInput高度 + QuickActions高度(33px) + 间距(28px bottom + 5px gap)
  const bottomDistance = chatInputHeight + 33 + 28 + BOTTOM_TO_QUICK_ACTIONS;

  // 默认区域（香港浸会大学）
  const defaultRegion = MAP_CONFIG.defaultCenter;
  const region = initialRegion || defaultRegion;

  // 生成 OpenStreetMap 的 HTML
  const generateOSMHtml = () => {
    const { latitude, longitude, latitudeDelta } = region;
    // 根据 latitudeDelta 计算缩放级别 (大约的转换)
    const zoom = Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);
          
          // 添加标记点
          ${markers.map((marker, index) => `
            var marker${index} = L.marker([${marker.latitude}, ${marker.longitude}])
              .addTo(map);
            
            marker${index}.on('click', function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                data: ${JSON.stringify(marker)}
              }));
            });
          `).join('\n')}
          
          // 通知 React Native 地图已加载
          setTimeout(() => {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapReady'}));
          }, 1000);
        </script>
      </body>
      </html>
    `;
  };

  // 当弹窗打开时，重置状态
  useEffect(() => {
    if (visible) {
      console.log('MapModal opened with region:', region);
      console.log('Using provider:', MAP_CONFIG.provider);
      setMapReady(false);
      setHasError(false);
      // 确保打开地图时不显示路线抽屉
      setRouteDrawerVisible(false);
      setCurrentRoute(null);
      setUserLocation(null);
      
      // 5秒后如果还没有加载完成，强制隐藏加载器
      const timeout = setTimeout(() => {
        console.log('Map loading timeout, forcing ready state');
        setMapReady(true);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  // 重置状态当弹窗关闭时
  const handleClose = () => {
    setMapReady(false);
    setHasError(false);
    setDrawerVisible(false);
    setRouteDrawerVisible(false);
    setSelectedBuilding(null);
    setCurrentRoute(null);
    setUserLocation(null);
    onClose();
  };

  // WebView 消息处理
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'mapReady') {
        console.log('✅ OSM Map ready');
        setMapReady(true);
      } else if (message.type === 'markerClick') {
        console.log('Marker clicked:', message.data);
        handleMarkerPress(message.data);
      }
    } catch (error) {
      // 兼容旧的简单字符串消息
      if (event.nativeEvent.data === 'mapReady') {
        console.log('✅ OSM Map ready');
        setMapReady(true);
      }
    }
  };

  // MapView 加载完成
  const handleMapReady = () => {
    console.log('✅ Google Map ready');
    setMapReady(true);
  };

  // 地图错误处理
  const handleMapError = (error) => {
    console.error('❌ Map error:', error);
    setHasError(true);
    setMapReady(true);
  };

  // 标记点击处理
  const handleMarkerPress = (marker) => {
    console.log('Building selected:', marker);
    setSelectedBuilding({
      title: marker.title || '建筑物',
      position: marker.position || `${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}`,
      features: marker.features || marker.description || '暂无特点信息',
      description: marker.description,
      ...marker,
    });
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setTimeout(() => {
      setSelectedBuilding(null);
    }, 300);
  };

  // 导航到建筑物
  const handleNavigate = (buildingInfo) => {
    console.log('Navigate to:', buildingInfo);
    
    // 模拟用户当前位置（实际应从GPS获取）
    const mockUserLocation = {
      latitude: region.latitude - 0.002, // 稍微偏离中心
      longitude: region.longitude - 0.002,
    };
    setUserLocation(mockUserLocation);
    
    // 关闭建筑详情抽屉
    setDrawerVisible(false);
    
    // 显示路线选择抽屉
    setRouteDrawerVisible(true);
    
    // 生成默认路线（第一条路线）
    generateRoute(mockUserLocation, buildingInfo, 0);
  };

  // 生成路线
  const generateRoute = (start, end, routeType = 0) => {
    // 模拟三条不同的路线
    const routes = [
      // 路线1：时间最少（较直接）
      [
        start,
        { latitude: start.latitude + 0.0005, longitude: start.longitude + 0.001 },
        { latitude: start.latitude + 0.001, longitude: start.longitude + 0.0015 },
        { latitude: end.latitude - 0.0003, longitude: end.longitude - 0.0002 },
        { latitude: end.latitude, longitude: end.longitude },
      ],
      // 路线2：距离最短（直线较多）
      [
        start,
        { latitude: start.latitude + 0.0008, longitude: start.longitude + 0.0008 },
        { latitude: end.latitude - 0.0002, longitude: end.longitude - 0.0002 },
        { latitude: end.latitude, longitude: end.longitude },
      ],
      // 路线3：方案三（绕路）
      [
        start,
        { latitude: start.latitude + 0.0003, longitude: start.longitude + 0.0012 },
        { latitude: start.latitude + 0.0008, longitude: start.longitude + 0.002 },
        { latitude: end.latitude - 0.0001, longitude: end.longitude + 0.0003 },
        { latitude: end.latitude, longitude: end.longitude },
      ],
    ];

    setCurrentRoute({
      coordinates: routes[routeType],
      start,
      end: { latitude: end.latitude, longitude: end.longitude },
      routeType,
    });
  };

  // 路线选择处理
  const handleRouteSelect = (route) => {
    console.log('Route selected:', route);
    if (userLocation && selectedBuilding) {
      generateRoute(userLocation, selectedBuilding, route.id);
    }
  };

  // 返回按钮处理 - 关闭路线规划
  const handleBackPress = () => {
    if (routeDrawerVisible) {
      // 如果正在显示路线规划，关闭它
      setRouteDrawerVisible(false);
      setCurrentRoute(null);
      setUserLocation(null);
    } else {
      // 否则关闭整个地图
      handleClose();
    }
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
          {/* 返回按钮 - 左上角 */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Text style={styles.backButtonText}>‹</Text>
            </View>
          </TouchableOpacity>

          {/* 关闭按钮 - 右上角 */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <View style={styles.closeButtonInner}>
              <Text style={styles.closeButtonText}>✕</Text>
            </View>
          </TouchableOpacity>

          {/* 地图视图 */}
          <View style={styles.mapContainer}>
            {!mapReady && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary || '#1E90FF'} />
                <Text style={styles.loadingText}>
                  加载地图中... {useWebView ? '(OpenStreetMap)' : '(Google Maps)'}
                </Text>
              </View>
            )}
            
            {hasError && mapReady && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>⚠️ 地图加载失败</Text>
                <Text style={styles.errorHint}>请检查网络连接或 API Key 配置</Text>
              </View>
            )}
            
            {/* 根据配置选择地图提供商 */}
            {useWebView ? (
              // OpenStreetMap (WebView)
              <WebView
                ref={webViewRef}
                source={{ html: generateOSMHtml() }}
                style={styles.map}
                onMessage={handleWebViewMessage}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                  handleMapError(nativeEvent);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={false}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              // Google Maps (MapView)
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={false}
                toolbarEnabled={false}
                rotateEnabled={true}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}
                minZoomLevel={0}
                maxZoomLevel={20}
                cacheEnabled={true}
                loadingEnabled={true}
                loadingIndicatorColor={theme.colors.primary || '#1E90FF'}
                loadingBackgroundColor="#F5F7FA"
                onMapReady={handleMapReady}
                onError={handleMapError}
              >
                {/* 用户当前位置标记 */}
                {userLocation && (
                  <Marker
                    coordinate={userLocation}
                    pinColor="#4CAF50"
                    title="当前位置"
                  />
                )}

                {/* 渲染标记点 */}
                {markers.map((marker, index) => (
                  <Marker
                    key={marker.id || index}
                    coordinate={{
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                    }}
                    onPress={() => handleMarkerPress(marker)}
                  />
                ))}

                {/* 目的地标记（路线模式下） */}
                {currentRoute && currentRoute.end && (
                  <Marker
                    coordinate={currentRoute.end}
                    pinColor="#F44336"
                    title={selectedBuilding?.title || '目的地'}
                  />
                )}

                {/* 路线绘制 */}
                {currentRoute && currentRoute.coordinates && (
                  <Polyline
                    coordinates={currentRoute.coordinates}
                    strokeColor={
                      currentRoute.routeType === 0 ? '#0090F0' :
                      currentRoute.routeType === 1 ? '#00C853' : '#FF6B00'
                    }
                    strokeWidth={4}
                    lineDashPattern={[0]}
                  />
                )}
              </MapView>
            )}
          </View>

          {/* 建筑详情抽屉 */}
          <MapDrawer
            visible={drawerVisible}
            onClose={handleDrawerClose}
            buildingInfo={selectedBuilding}
            onNavigate={handleNavigate}
          />

          {/* 路线选择抽屉 */}
          <RouteDrawer
            visible={routeDrawerVisible}
            onClose={() => {
              setRouteDrawerVisible(false);
              setCurrentRoute(null);
              setUserLocation(null);
            }}
            onRouteSelect={handleRouteSelect}
            destination={selectedBuilding}
          />
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
    overflow: 'hidden',
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
  closeButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    lineHeight: 18,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '600',
    lineHeight: 28,
    marginRight: 2, // 微调位置使箭头居中
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F5F7FA',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    zIndex: 50,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorHint: {
    fontSize: 13,
    color: '#991B1B',
  },
});

export default MapModal;
