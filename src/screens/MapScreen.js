import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// 香港浸会大学的坐标
const HKBU_LOCATION = {
  latitude: 22.3387,
  latitudeDelta: 0.005,
  longitude: 114.2061,
  longitudeDelta: 0.005,
};

// 校园建筑物标记点
const CAMPUS_MARKERS = [
  {
    id: '1',
    title: '香港浸会大学',
    subtitle: '主校区',
    coordinate: { latitude: 22.3387, longitude: 114.2061 },
    type: 'main',
  },
  {
    id: '2',
    title: '香港浸会大学 - 邵逸夫图书馆',
    subtitle: '图书馆',
    coordinate: { latitude: 22.3395, longitude: 114.2068 },
    type: 'library',
  },
  {
    id: '3',
    title: '大学礼拜堂',
    subtitle: '礼堂',
    coordinate: { latitude: 22.3380, longitude: 114.2055 },
    type: 'chapel',
  },
  {
    id: '4',
    title: '香港浸会大学 - 教学大楼',
    subtitle: '教学楼',
    coordinate: { latitude: 22.3390, longitude: 114.2063 },
    type: 'teaching',
  },
  {
    id: '5',
    title: '医疗保健学院',
    subtitle: '学院大楼',
    coordinate: { latitude: 22.3375, longitude: 114.2070 },
    type: 'school',
  },
  {
    id: '6',
    title: '浸大校园',
    subtitle: '校舍',
    coordinate: { latitude: 22.3383, longitude: 114.2048 },
    type: 'campus',
  },
  {
    id: '7',
    title: '学生宿舍',
    subtitle: '住宿',
    coordinate: { latitude: 22.3397, longitude: 114.2075 },
    type: 'dormitory',
  },
];

// 底部标签选项
const BOTTOM_TABS = [
  { id: 'search', icon: '🔍', label: 'Searching' },
  { id: 'building', icon: '🏢', label: 'Building', active: true },
  { id: 'toilet', icon: '🚻', label: 'Toilet' },
  { id: 'dining', icon: '🍽️', label: 'Catering' },
  { id: 'all', icon: '⋯', label: 'All' },
];

/**
 * 地图页面
 * 显示校园地图和建筑物标记
 */
const MapScreen = ({ navigation }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedTab, setSelectedTab] = useState('building');
  const mapRef = useRef(null);

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion({
      ...marker.coordinate,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 300);
  };

  const handleTabPress = (tabId) => {
    setSelectedTab(tabId);
    console.log('Selected tab:', tabId);
  };

  const getMarkerColor = (type) => {
    const colors = {
      main: '#1E90FF',
      library: '#4169E1',
      chapel: '#FF6B6B',
      teaching: '#1E90FF',
      school: '#FFB84D',
      campus: '#1E90FF',
      dormitory: '#9B59B6',
    };
    return colors[type] || '#1E90FF';
  };

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hong Kong Baptist University</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>⋯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>⊙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 地图视图 */}
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

      {/* 地图控制按钮 */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            mapRef.current?.animateToRegion(HKBU_LOCATION, 500);
          }}
        >
          <Text style={styles.controlIcon}>⊙</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            // 放大地图
            const newRegion = {
              ...HKBU_LOCATION,
              latitudeDelta: HKBU_LOCATION.latitudeDelta * 0.5,
              longitudeDelta: HKBU_LOCATION.longitudeDelta * 0.5,
            };
            mapRef.current?.animateToRegion(newRegion, 300);
          }}
        >
          <Text style={styles.controlIcon}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            // 缩小地图
            const newRegion = {
              ...HKBU_LOCATION,
              latitudeDelta: HKBU_LOCATION.latitudeDelta * 2,
              longitudeDelta: HKBU_LOCATION.longitudeDelta * 2,
            };
            mapRef.current?.animateToRegion(newRegion, 300);
          }}
        >
          <Text style={styles.controlIcon}>−</Text>
        </TouchableOpacity>
      </View>

      {/* 底部标签栏 */}
      <View style={styles.bottomTabBar}>
        {BOTTOM_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.bottomTab,
              selectedTab === tab.id && styles.bottomTabActive,
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                selectedTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 底部提示 */}
      <View style={styles.helpContainer}>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpIcon}>🖼️</Text>
        </TouchableOpacity>
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>Need help? Just ask me...</Text>
        </View>
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* 选中标记信息卡片 */}
      {selectedMarker && (
        <View style={styles.markerInfoCard}>
          <TouchableOpacity
            style={styles.closeInfoButton}
            onPress={() => setSelectedMarker(null)}
          >
            <Text style={styles.closeInfoIcon}>×</Text>
          </TouchableOpacity>
          <Text style={styles.markerTitle}>{selectedMarker.title}</Text>
          <Text style={styles.markerSubtitle}>{selectedMarker.subtitle}</Text>
          <TouchableOpacity style={styles.navigateButton}>
            <Text style={styles.navigateButtonText}>导航到此地</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
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
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: theme.spacing.md,
    top: Platform.OS === 'ios' ? 120 : 110,
    zIndex: 5,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  controlIcon: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  bottomTabActive: {
    backgroundColor: '#E8F4FD',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 24,
  },
  helpTextContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
  },
  helpText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  markerInfoCard: {
    position: 'absolute',
    bottom: 200,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  closeInfoButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeInfoIcon: {
    fontSize: 24,
    color: theme.colors.textLight,
  },
  markerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    paddingRight: 32,
  },
  markerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  navigateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});

export default MapScreen;