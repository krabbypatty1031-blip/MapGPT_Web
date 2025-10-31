import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, Dimensions, Image } from 'react-native';
import { NavigationIcon } from '../icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 抽屉高度配置
const DRAWER_HEIGHT = 200; // 单档高度
const CLOSE_THRESHOLD = 80; // 下拉多少关闭

/**
 * 地图底部抽屉组件
 * 单档模式：点击marker打开，向下拖动关闭
 * @param {boolean} visible - 是否显示抽屉
 * @param {Function} onClose - 关闭抽屉的回调
 * @param {Object} buildingInfo - 建筑物信息 (包含 title, position, features, description, image 等)
 * @param {Function} onNavigate - 点击"去这里"的回调
 */
const MapDrawer = ({ visible, onClose, buildingInfo, onNavigate }) => {
  const drawerHeight = useRef(new Animated.Value(0)).current;

  // 创建手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // 向下拖动：减少高度
          const newHeight = Math.max(DRAWER_HEIGHT - gestureState.dy, 0);
          drawerHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > CLOSE_THRESHOLD) {
          // 向下拖动超过阈值，关闭
          closeDrawer();
        } else {
          // 回弹到打开状态
          openDrawer();
        }
      },
    })
  ).current;

  // 打开抽屉
  const openDrawer = () => {
    Animated.spring(drawerHeight, {
      toValue: DRAWER_HEIGHT,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  // 关闭抽屉
  const closeDrawer = () => {
    Animated.timing(drawerHeight, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (onClose) onClose();
    });
  };  // 监听 visible 变化
  useEffect(() => {
    if (visible) {
      openDrawer();
    } else {
      drawerHeight.setValue(0);
    }
  }, [visible]);

  if (!buildingInfo) return null;

  return (
    <Animated.View
      style={[
        styles.drawer,
        {
          height: drawerHeight,
          overflow: 'hidden',
        },
      ]}
    >
      {/* 拖动条 */}
      <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
        <View style={styles.dragHandle} />
      </View>

      {/* 内容区域 */}
      <View style={styles.content}>
        {/* 建筑物名称 */}
        <Text style={styles.title}>{buildingInfo.title || '建筑物'}</Text>

        {/* 详细信息 */}
        {buildingInfo.position && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 位置:</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {buildingInfo.position}
            </Text>
          </View>
        )}

        {buildingInfo.features && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 特点:</Text>
            <Text style={styles.infoText} numberOfLines={2}>
              {buildingInfo.features}
            </Text>
          </View>
        )}

        {buildingInfo.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 描述:</Text>
            <Text style={styles.infoText} numberOfLines={2}>
              {buildingInfo.description}
            </Text>
          </View>
        )}
      </View>

      {/* 去这里按钮 - 移到 drawer 容器内，独立于 content */}
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => onNavigate && onNavigate(buildingInfo)}
        activeOpacity={0.8}
      >
        <NavigationIcon width={14} height={14} />
        <Text style={styles.navigateButtonText}>去这里</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    // 不设置 paddingBottom，避免关闭时残留
  },
  dragHandleContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    cursor: 'grab',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 70, // 为"去这里"按钮留出空间（按钮30px + 间距20px + 底部间距20px）
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  buildingImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
    minWidth: 60,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  navigateButton: {
    position: 'absolute',
    bottom: 20, // 距离抽屉底部20px（内置底部间距）
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1FAFF',
    width: 76,
    height: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
  },
  navigateButtonText: {
    fontSize: 12,
    fontWeight: '613',
    lineHeight: 14,
    color: '#0090F0',
    marginLeft: 4, // 图标和文字之间的间距
  },
});

export default MapDrawer;
