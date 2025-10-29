import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * 路线选择抽屉组件
 * @param {boolean} visible - 是否显示
 * @param {Function} onClose - 关闭回调
 * @param {Function} onRouteSelect - 路线选择回调
 * @param {Object} destination - 目的地信息
 */
const RouteDrawer = ({ visible, onClose, onRouteSelect, destination }) => {
  const [selectedRoute, setSelectedRoute] = useState(0);

  // 模拟三条路线数据
  const routes = [
    {
      id: 0,
      duration: '10分钟',
      distance: '1.3公里',
      description: '时间最少',
      color: '#0090F0', // 蓝色
    },
    {
      id: 1,
      duration: '13分钟',
      distance: '1公里',
      description: '距离最短',
      color: '#00C853', // 绿色
    },
    {
      id: 2,
      duration: '15分钟',
      distance: '2公里',
      description: '方案三',
      color: '#FF6B00', // 橙色
    },
  ];

  const handleRouteSelect = (routeId) => {
    setSelectedRoute(routeId);
    onRouteSelect && onRouteSelect(routes[routeId]);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* 路线选项 */}
      <View style={styles.routeOptions}>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.routeCard,
              index === 1 && styles.routeCardMiddle, // 中间卡片有左右间隙
              selectedRoute === route.id && styles.routeCardSelected,
            ]}
            onPress={() => handleRouteSelect(route.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.routeDuration,
              selectedRoute === route.id && styles.textSelected,
            ]}>
              {route.duration}
            </Text>
            <Text style={[
              styles.routeDistance,
              selectedRoute === route.id && styles.textSelected,
            ]}>
              {route.distance}
            </Text>
            <Text style={[
              styles.routeDescription,
              selectedRoute === route.id && styles.textSelected,
            ]}>
              {route.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 开始导航按钮 */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => {
          console.log('开始导航到:', destination?.title);
          // TODO: 实现导航功能
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>开始导航</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF', // 整体背景灰色
    borderTopLeftRadius: 0, // 改为直角
    borderTopRightRadius: 10, // 右上角圆角
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: 0,
    paddingBottom: 12, // 降低高度
  },
  routeOptions: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: 8, // 减小间距
    height: 80, // 降低高度
  },
  routeCard: {
    flex: 1,
    backgroundColor: '#fbfbfb', // 未选中灰色背景
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  routeCardMiddle: {
    marginHorizontal: 1, // 中间卡片左右各1px间隙，形成分隔
  },
  routeCardSelected: {
    backgroundColor: '#FFFFFF', // 选中白色背景
    borderTopLeftRadius: 10, // 选中时左上角圆角
    borderTopRightRadius: 10, // 选中时右上角圆角
    marginHorizontal: 0, // 选中时去掉间隙，完整显示圆角
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: '613',
    color: '#86868B', // 未选中灰色文字
    lineHeight: 25,
    marginBottom: 2,
  },
  routeDistance: {
    fontSize: 12,
    fontWeight: '613',
    color: '#86868B', // 未选中灰色文字
    lineHeight: 17,
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: 12,
    fontWeight: '613',
    color: '#86868B', // 未选中灰色文字
    lineHeight: 17,
  },
  textSelected: {
    color: '#0086DF', // 选中蓝色文字
  },
  startButton: {
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 8, // 减小底部间距
    height: 36,
    borderRadius: 100,
    paddingVertical: 7.5,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B9BFB',
    shadowColor: '#0090F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '613',
    color: '#FFFFFF',
    lineHeight: 21,
  },
});

export default RouteDrawer;
