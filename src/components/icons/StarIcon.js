import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

/**
 * 渐变星星图标 - 用于功能引导标题
 * 带有阴影和内阴影效果的星星图标
 */
const StarIcon = ({ size = 15 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Defs>
        <Filter
          id="filter0_di_51_3621"
          x="0.4223"
          y="0.4223"
          width="14.0067"
          height="14.0067"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dx="0.285259" dy="0.285259" />
          <FeGaussianBlur stdDeviation="0.570517" />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_51_3621" />
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_51_3621" result="shape" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy="-0.285259" />
          <FeGaussianBlur stdDeviation="0.570517" />
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <FeColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
          <FeBlend mode="normal" in2="shape" result="effect2_innerShadow_51_3621" />
        </Filter>
        <LinearGradient
          id="paint0_linear_51_3621"
          x1="9.00012"
          y1="4.5"
          x2="4.50012"
          y2="11.5"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#86E0D7" />
          <Stop offset="0.655169" stopColor="#559FF8" />
          <Stop offset="1" stopColor="#3D2BFF" />
        </LinearGradient>
      </Defs>
      <G filter="url(#filter0_di_51_3621)">
        <Path
          d="M8.41846 1.27803L8.42822 2.50906C8.44655 4.82166 9.79236 6.91785 11.8875 7.89709L13.0027 8.41836L11.7717 8.42812C9.45911 8.44645 7.36292 9.79226 6.38368 11.8874L5.86241 13.0026L5.85265 11.7716C5.83432 9.45901 4.48851 7.36282 2.39339 6.38357L1.27813 5.86231L2.50916 5.85255C4.82176 5.83422 6.91795 4.48841 7.89719 2.39329L8.41846 1.27803Z"
          fill="url(#paint0_linear_51_3621)"
        />
      </G>
    </Svg>
  );
};

export default StarIcon;
