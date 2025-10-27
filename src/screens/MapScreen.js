import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../constants/theme';
import { HKBU_LOCATION, CAMPUS_MARKERS, MARKER_COLORS } from '../constants/mapData';
import Header from '../components/common/Header';
import MapControls from '../components/map/MapControls';
import MarkerInfoCard from '../components/map/MarkerInfoCard';
import BottomTabBar from '../components/map/BottomTabBar';
import MapInputBar from '../components/map/MapInputBar';

/**
 * 地图页面
 * 显示校园地图和建筑物标记
 */
const MapScreen = ({ navigation }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedTab, setSelectedTab] = useState('building');
  const mapRef = useRef(null);

  // 标记点击处理
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion({
      ...marker.coordinate,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 300);
  };

  // 定位按钮处理
  const handleLocate = () => {
    mapRef.current?.animateToRegion(HKBU_LOCATION, 500);
  };

  // 放大按钮处理
  const handleZoomIn = () => {
    const newRegion = {
      ...HKBU_LOCATION,
      latitudeDelta: HKBU_LOCATION.latitudeDelta * 0.5,
      longitudeDelta: HKBU_LOCATION.longitudeDelta * 0.5,
    };
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  // 缩小按钮处理
  const handleZoomOut = () => {
    const newRegion = {
      ...HKBU_LOCATION,
      latitudeDelta: HKBU_LOCATION.latitudeDelta * 2,
      longitudeDelta: HKBU_LOCATION.longitudeDelta * 2,
    };
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  // 标签切换处理
  const handleTabPress = (tabId) => {
    setSelectedTab(tabId);
    console.log('Selected tab:', tabId);
  };

  // 导航按钮处理
  const handleNavigate = () => {
    console.log('Navigate to:', selectedMarker?.title);
    // TODO: 实现导航功能
  };

  // 获取标记颜色
  const getMarkerColor = (type) => {
    return MARKER_COLORS[type] || MARKER_COLORS.default;
  };

  // Header 右侧按钮
  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      <View style={styles.iconButton}>
        <Text style={styles.iconText}>⋯</Text>
      </View>
      <View style={styles.iconButton}>
        <Text style={styles.iconText}>⊙</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Hong Kong Baptist University" 
        onBack={() => navigation.goBack()}
        rightComponent={renderHeaderRight()}
      />

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={HKBU_LOCATION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {CAMPUS_MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.subtitle}
            onPress={() => handleMarkerPress(marker)}
            pinColor={getMarkerColor(marker.type)}
          />
        ))}
      </MapView>

      <MapControls
        onLocate={handleLocate}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <MarkerInfoCard
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        onNavigate={handleNavigate}
      />

      <BottomTabBar
        selectedTab={selectedTab}
        onTabPress={handleTabPress}
      />

      <MapInputBar
        onCameraPress={() => console.log('Camera pressed')}
        onGalleryPress={() => console.log('Gallery pressed')}
        onSendPress={() => console.log('Send pressed')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  map: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: theme.colors.text,
    fontSize: 20,
  },
});

export default MapScreen;
