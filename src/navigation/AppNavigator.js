import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import WelcomeScreen from '../screens/WelcomeScreen';
import AssistantScreen from '../screens/AssistantScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createStackNavigator();

/**
 * 应用导航配置
 * 管理页面间的导航和转场动画
 */
const AppNavigator = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              title: '欢迎',
            }}
          />
          <Stack.Screen 
            name="Assistant" 
            component={AssistantScreen}
            options={{
              title: 'AI助手',
            }}
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen}
            options={{
              title: '校园地图',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default AppNavigator;
