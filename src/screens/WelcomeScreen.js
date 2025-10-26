import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const SLIDER_WIDTH = 320;
const BUTTON_WIDTH = 80; // 横向拉长
const BUTTON_HEIGHT = 50; // 和轨道保持一致的间距
const PADDING = 4; // 按钮和轨道之间的间距
const SLIDE_THRESHOLD = SLIDER_WIDTH - BUTTON_WIDTH - PADDING * 2;

/**
 * 欢迎页面
 * 显示机器人助手和欢迎信息
 * 通过滑动按钮解锁进入下一页面
 */
const WelcomeScreen = ({ navigation }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // 重置滑块位置的函数
  const resetSlider = useCallback(() => {
    setIsUnlocked(false);
    slideAnim.setValue(0);
    opacityAnim.setValue(1);
  }, [slideAnim, opacityAnim]);

  // 当页面获得焦点时，重置滑块
  useFocusEffect(
    useCallback(() => {
      resetSlider();
    }, [resetSlider])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        slideAnim.setOffset(slideAnim._value);
      },
      onPanResponderMove: (_, gesture) => {
        const newValue = Math.max(0, Math.min(gesture.dx, SLIDE_THRESHOLD));
        slideAnim.setValue(newValue);
        
        // 计算透明度 - 滑动越多，文字越淡
        const opacity = 1 - (newValue / SLIDE_THRESHOLD) * 0.7;
        opacityAnim.setValue(opacity);
      },
      onPanResponderRelease: (_, gesture) => {
        slideAnim.flattenOffset();
        
        if (gesture.dx > SLIDE_THRESHOLD * 0.8) {
          // 滑动超过阈值，解锁成功
          Animated.spring(slideAnim, {
            toValue: SLIDE_THRESHOLD,
            useNativeDriver: false,
          }).start(() => {
            setIsUnlocked(true);
            setTimeout(() => {
              navigation.navigate('Assistant');
            }, 200);
          });
        } else {
          // 滑动不足，回弹
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* 中间内容 */}
      <View style={styles.content}>
        {/* 机器人图像 */}
        <View style={styles.robotContainer}>
          <Image 
            source={require('../assets/robot.png')}
            style={styles.robotImage}
            resizeMode="contain"
          />
        </View>

        {/* 欢迎文本 */}
        <View style={styles.welcomeContainer}>
          <Image 
            source={require('../assets/paper.png')}
            style={styles.paperImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 底部滑动解锁 */}
      <View style={styles.bottomContainer}>
        <View style={styles.sliderTrack}>
          <Animated.View
            style={[
              styles.sliderButton,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.arrowContainer}>
              <Text style={styles.arrowText}>›››</Text>
            </View>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.sliderTextContainer,
              {
                opacity: opacityAnim,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.sliderText}>右滑开启AI之旅</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  robotContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  robotImage: {
    width: 250,
    height: 320,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paperImage: {
    width: width * 0.85,
    height: 120,
  },
  bottomContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 58,
    backgroundColor: '#1E90FF',
    borderRadius: 32,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 28, // 和轨道保持一致的圆角比例
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E90FF',
    transform: [{ rotate: '0deg' }],
  },
  sliderTextContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;