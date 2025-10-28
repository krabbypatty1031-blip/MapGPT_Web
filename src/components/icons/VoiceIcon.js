import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * 语音输入图标
 */
const VoiceIcon = ({ size = 22, color = '#1D2129' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M10.9999 20.1667C16.0625 20.1667 20.1666 16.0627 20.1666 11C20.1666 5.93743 16.0625 1.83337 10.9999 1.83337C5.93731 1.83337 1.83325 5.93743 1.83325 11C1.83325 16.0627 5.93731 20.1667 10.9999 20.1667Z"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinejoin="round"
      />
      <Circle
        cx="7.79167"
        cy="10.9534"
        r="0.91667"
        fill={color}
      />
      <Path
        d="M10.0618 13.2242C10.6424 12.6436 11.0015 11.8415 11.0015 10.9555C11.0015 10.0696 10.6424 9.26751 10.0618 8.68689"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.3284 15.4912C13.4896 14.33 14.2078 12.7258 14.2078 10.9539C14.2078 9.18198 13.4896 7.57781 12.3284 6.41663"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default VoiceIcon;
