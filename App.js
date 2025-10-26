import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * MapGPT - 香港浸会大学智能地图助手
 * 主应用入口
 * 
 * @version 2.0.0
 * @description 优化版本，使用最新的 Expo SDK 和 React Navigation
 */
export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
