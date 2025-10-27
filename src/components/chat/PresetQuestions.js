import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../../constants/theme';
import { getPresetQuestions } from '../../services/chatService';

/**
 * 预设问题卡片组件
 * 显示推荐的问题供用户快速选择
 * @param {Function} onSelectQuestion - 选择问题的回调
 */
const PresetQuestions = ({ onSelectQuestion }) => {
  const presetQuestions = getPresetQuestions();

  return (
    <View style={styles.container}>
      {/* 头像和欢迎语 */}
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../assets/title.png')}
          style={styles.avatarImage}
        />
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.helloText}>Hello~</Text>
        <Text style={styles.descriptionText}>
          我是你的香港浸会大学
          <Text style={styles.highlightText}>智能AI助手</Text>
        </Text>
      </View>

      {/* AI记录 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>✨</Text>
          <Text style={styles.sectionLabel}>AI记录</Text>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectQuestion(presetQuestions[0]?.text)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardText}>
            查询香港浸会大学图书馆开放时间
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectQuestion(presetQuestions[1]?.text)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  avatarContainer: {
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatarImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  greetingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  helloText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'left',
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: theme.spacing.md,
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
