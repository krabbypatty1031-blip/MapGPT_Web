import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, Dimensions, Image } from 'react-native';
import { theme } from '../../constants/theme';
import { NavigationIcon } from '../icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 地图底部抽屉组件
 * @param {boolean} visible - 是否显示抽屉
 * @param {Function} onClose - 关闭抽屉的回调
 * @param {Object} buildingInfo - 建筑物信息 (包含 title, position, features, description, image 等)
 * @param {Function} onNavigate - 点击"去这里"的回调
 */
const MapDrawer = ({ visible, onClose, buildingInfo, onNavigate }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const drawerHeight = useRef(new Animated.Value(200)).current; // 抽屉高度动画值
  const [isExpanded, setIsExpanded] = useState(false); // 是否展开到第二档

  // 抽屉高度配置
  const DRAWER_HEIGHT_COLLAPSED = 200; // 第一档高度（默认）
  const DRAWER_HEIGHT_EXPANDED = 400; // 第二档高度（展开）
  const CLOSE_THRESHOLD = 80; // 下拉多少距离后关闭
  const COLLAPSE_THRESHOLD = 60; // 从展开状态下拉多少距离后收起到第一档
  const EXPAND_THRESHOLD = 50; // 向上拖动多少距离后展开到第二档

  // 创建手势响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只响应垂直拖动
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentHeight = isExpanded ? DRAWER_HEIGHT_EXPANDED : DRAWER_HEIGHT_COLLAPSED;
        
        if (gestureState.dy > 0) {
          // 向下拖动 - 允许收起或关闭
          translateY.setValue(gestureState.dy);
        } else {
          // 向上拖动
          if (isExpanded) {
            // 已展开状态，不允许继续向上拖动
            return;
          } else {
            // 收起状态，允许向上拖动并实时增加高度
            const dragDistance = Math.abs(gestureState.dy);
            const newHeight = Math.min(
              DRAWER_HEIGHT_COLLAPSED + dragDistance,
              DRAWER_HEIGHT_EXPANDED
            );
            drawerHeight.setValue(newHeight);
            translateY.setValue(0); // 保持底部对齐
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = isExpanded ? DRAWER_HEIGHT_EXPANDED : DRAWER_HEIGHT_COLLAPSED;
        
        if (gestureState.dy > 0) {
          // 向下拖动
          if (isExpanded) {
            // 从展开状态向下拖动
            if (gestureState.dy > CLOSE_THRESHOLD) {
              // 拖动幅度大，直接关闭
              closeDrawer();
            } else if (gestureState.dy > COLLAPSE_THRESHOLD) {
              // 拖动幅度中等，收起到第一档
              collapseDrawer();
            } else {
              // 拖动幅度小，回到展开状态
              snapBack();
            }
          } else {
            // 从收起状态向下拖动
            if (gestureState.dy > CLOSE_THRESHOLD) {
              // 关闭抽屉
              closeDrawer();
            } else {
              // 回到收起状态
              snapBack();
            }
          }
        } else {
          // 向上拖动
          const dragDistance = Math.abs(gestureState.dy);
          if (!isExpanded && dragDistance > EXPAND_THRESHOLD) {
            // 展开到第二档
            expandDrawer();
          } else {
            // 回到当前状态
            snapBack();
          }
        }
      },
    })
  ).current;

  // 打开抽屉（第一档）
  const openDrawer = () => {
    setIsExpanded(false);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(drawerHeight, {
        toValue: DRAWER_HEIGHT_COLLAPSED,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  };

  // 展开到第二档
  const expandDrawer = () => {
    setIsExpanded(true);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(drawerHeight, {
        toValue: DRAWER_HEIGHT_EXPANDED,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  };

  // 收起到第一档
  const collapseDrawer = () => {
    setIsExpanded(false);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(drawerHeight, {
        toValue: DRAWER_HEIGHT_COLLAPSED,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  };

  // 回弹到当前档位
  const snapBack = () => {
    const targetHeight = isExpanded ? DRAWER_HEIGHT_EXPANDED : DRAWER_HEIGHT_COLLAPSED;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(drawerHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  };

  // 关闭抽屉
  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isExpanded ? DRAWER_HEIGHT_EXPANDED : DRAWER_HEIGHT_COLLAPSED,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(drawerHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsExpanded(false);
      onClose && onClose();
    });
  };

  // 监听 visible 变化
  useEffect(() => {
    if (visible) {
      openDrawer();
    } else {
      // 隐藏时重置状态
      translateY.setValue(0);
      drawerHeight.setValue(0);
      setIsExpanded(false);
    }
  }, [visible]);

  if (!buildingInfo) return null;

  return (
    <Animated.View
      style={[
        styles.drawer,
        {
          height: drawerHeight,
          transform: [{ translateY }],
          overflow: 'hidden', // 防止内容溢出
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

        {/* 图片 - 只在展开状态显示 */}
        {isExpanded && buildingInfo.image && (
          <Image 
            source={typeof buildingInfo.image === 'string' ? { uri: buildingInfo.image } : buildingInfo.image}
            style={styles.buildingImage}
            resizeMode="cover"
          />
        )}

        {/* 详细信息 */}
        {buildingInfo.position && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 位置:</Text>
            <Text style={styles.infoText} numberOfLines={isExpanded ? 0 : 1}>
              {buildingInfo.position}
            </Text>
          </View>
        )}

        {buildingInfo.features && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 特点:</Text>
            <Text style={styles.infoText} numberOfLines={isExpanded ? 0 : 2}>
              {buildingInfo.features}
            </Text>
          </View>
        )}

        {buildingInfo.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>• 描述:</Text>
            <Text style={styles.infoText} numberOfLines={isExpanded ? 0 : 2}>
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
