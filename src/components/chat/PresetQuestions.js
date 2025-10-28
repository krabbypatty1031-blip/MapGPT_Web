import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { ACTION_GUIDES } from '../../constants/chatData';
import ChatHeader from './ChatHeader';
import { StarIcon } from '../icons';

/**
 * 预设问题卡片组件
 * 显示推荐的问题供用户快速选择
 * @param {Function} onSelectQuestion - 选择问题的回调
 * @param {string} selectedAction - 当前选择的快捷功能ID
 */
const PresetQuestions = ({ onSelectQuestion, selectedAction }) => {
  // 用于显示的内容状态（延迟更新，等待动画完成）
  const [displayedAction, setDisplayedAction] = useState(selectedAction);
  // 标记是否是首次渲染
  const isFirstRender = useRef(true);
  
  // 根据显示的功能获取对应的引导内容
  const guide = displayedAction ? ACTION_GUIDES[displayedAction] : null;
  
  // 动画值 - 首次渲染从20开始（从下方淡入）
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  // 首次渲染动画
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // 首次渲染：从上到下淡入
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  // 当 selectedAction 变化时触发动画
  useEffect(() => {
    if (isFirstRender.current) {
      // 首次渲染跳过
      return;
    }

    if (selectedAction === displayedAction) {
      // 内容相同，不需要动画
      return;
    }

    // 淡出动画：从下到上淡出
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20, // 向上移动
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 淡出完成后，切换内容
      setDisplayedAction(selectedAction);
      
      // 重置位置并淡入：从上到下淡入
      translateYAnim.setValue(20); // 从下方开始
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0, // 移动到原位
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [selectedAction]);

  return (
    <View style={styles.container}>
      {/* 头像和欢迎语 */}
      <ChatHeader />

      {guide ? (
        // 显示选中功能的使用引导
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          }}
          renderToHardwareTextureAndroid
          collapsable={false}
        >
          <View style={styles.section}>
            <View style={styles.guideHeader}>
              <View style={styles.starIconContainer}>
                <StarIcon size={14.28} />
              </View>
              <Text style={styles.guideTitle}>{guide.title}</Text>
            </View>

            {guide.examples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => onSelectQuestion(example)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ) : (
        // 未选择功能时显示默认内容
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          }}
          renderToHardwareTextureAndroid
          collapsable={false}
        >
          {/* AI记录 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>✨</Text>
              <Text style={styles.sectionLabel}>AI记录</Text>
            </View>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
            >
              <Text style={styles.cardText}>
                查询香港浸会大学图书馆开放时间
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
            >
              <Text style={styles.cardText}>
                从学生会到教学楼A座的路线
              </Text>
            </TouchableOpacity>
          </View>

          {/* AI推荐 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔥</Text>
              <Text style={styles.sectionLabel}>AI推荐</Text>
            </View>

            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <Text style={styles.cardText}>图书馆资源导览</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <Text style={styles.cardText}>校园美食推荐</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <Text style={styles.cardText}>运动设施介绍</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 120,
  },
  section: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 8,
    gap: 4,
  },
  starIconContainer: {
    width: 14.28,
    height: 14.28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideTitle: {
    flex: 1,
    fontSize: 10,
    color: '#86909C',
    fontWeight: '513',
    lineHeight: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 12,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    alignSelf: 'flex-start',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
});

export default PresetQuestions;
