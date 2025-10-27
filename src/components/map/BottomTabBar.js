import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { BOTTOM_TABS } from '../../constants/mapData';

/**
 * 底部标签栏组件
 * 显示地图过滤选项（搜索、建筑、厕所、餐饮、全部）
 */
const BottomTabBar = ({ selectedTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {BOTTOM_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && styles.tabActive,
          ]}
          onPress={() => onTabPress(tab.id)}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  tabActive: {
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
});

export default BottomTabBar;
