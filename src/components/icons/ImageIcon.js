import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * 图片/上传图标
 */
const ImageIcon = ({ size = 22, color = '#1D2129' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M10.9999 20.1667C16.0625 20.1667 20.1666 16.0627 20.1666 11C20.1666 5.93743 16.0625 1.83337 10.9999 1.83337C5.93731 1.83337 1.83325 5.93743 1.83325 11C1.83325 16.0627 5.93731 20.1667 10.9999 20.1667Z"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.125 16.9584L7.79167 12.8334L15.125 18.7917"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="8.25008"
        cy="7.79171"
        r="1.83333"
        stroke={color}
        strokeWidth="1.83333"
      />
      <Path
        d="M11 15.125L14.6667 10.5416L19.25 14.2083"
        stroke={color}
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ImageIcon;
