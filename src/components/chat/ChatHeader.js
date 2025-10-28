import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * AI助手欢迎头部组件
 * 显示头像和欢迎语，可复用于多个场景
 */
const ChatHeader = () => {
  return (
    <View style={styles.container}>
      {/* 头像 */}
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../assets/title.png')}
          style={styles.avatarImage}
        />
      </View>

      {/* 欢迎语 */}
      <View style={styles.greetingContainer}>
        <Text style={styles.helloText}>Hello~</Text>
        <Text style={styles.descriptionText}>
          我是你的香港浸会大学
          <Text style={styles.highlightText}>智能AI助手</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  avatarContainer: {
    alignItems: 'flex-start',
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
});

export default ChatHeader;
