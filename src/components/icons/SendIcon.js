import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * 发送图标 - 圆形渐变背景 + 向上箭头
 */
const SendIcon = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sendGradientFill" x1="2" y1="12" x2="22" y2="12">
          <Stop offset="0" stopColor="#3399FF" />
          <Stop offset="1" stopColor="#086DFF" />
        </LinearGradient>
        <LinearGradient id="sendGradientStroke" x1="2" y1="12" x2="22" y2="12">
          <Stop offset="0" stopColor="#3399FF" />
          <Stop offset="1" stopColor="#086DFF" />
        </LinearGradient>
      </Defs>
      
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill="url(#sendGradientFill)"
        stroke="url(#sendGradientStroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      <Path
        d="M12 16.75V7.75"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <Path
        d="M16.5 12.25L12 7.75L7.5 12.25"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default SendIcon;
