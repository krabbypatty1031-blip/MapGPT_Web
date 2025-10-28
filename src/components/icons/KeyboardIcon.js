import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * 键盘图标组件
 * @param {number} size - 图标大小
 * @param {string} color - 图标颜色
 */
const KeyboardIcon = ({ size = 22, color = '#1D2129' }) => (
  <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <Path
      d="M10.9999 20.1667C16.0625 20.1667 20.1666 16.0627 20.1666 11C20.1666 5.93743 16.0625 1.83337 10.9999 1.83337C5.93731 1.83337 1.83325 5.93743 1.83325 11C1.83325 16.0627 5.93731 20.1667 10.9999 20.1667Z"
      stroke={color}
      strokeWidth="1.83333"
      strokeLinejoin="round"
    />
    <Circle cx="6.87508" cy="7.56246" r="1.14583" fill={color} />
    <Circle cx="6.87508" cy="11.2292" r="1.14583" fill={color} />
    <Circle cx="11.0001" cy="7.56246" r="1.14583" fill={color} />
    <Circle cx="11.0001" cy="11.2292" r="1.14583" fill={color} />
    <Circle cx="15.1251" cy="7.56246" r="1.14583" fill={color} />
    <Circle cx="15.1251" cy="11.2292" r="1.14583" fill={color} />
    <Path
      d="M7.79175 15.125H14.2084"
      stroke={color}
      strokeWidth="1.83333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default KeyboardIcon;
