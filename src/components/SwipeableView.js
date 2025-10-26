import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 可滑动视图组件（兼容 Reanimated v3）
 * 支持右滑切换页面
 */
const SwipeableView = ({ children, onSwipeRight, swipeThreshold = SCREEN_WIDTH * 0.3 }) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // ✅ 新写法：使用 Gesture API 代替 useAnimatedGestureHandler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      // 只允许向右滑动
      if (event.translationX > 0) {
        translateX.value = startX.value + event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > swipeThreshold && event.velocityX > 0) {
        // 滑动距离超过阈值，触发页面切换
        translateX.value = withSpring(SCREEN_WIDTH, {}, () => {
          if (onSwipeRight) {
            runOnJS(onSwipeRight)();
          }
        });
      } else {
        // 回弹
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeableView;
