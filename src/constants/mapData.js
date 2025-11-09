/**
 * 地图相关常量数据
 */

// 香港浸会大学主校区位置
export const HKBU_LOCATION = {
  latitude: 22.34019,
  longitude: 114.18021,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

// 当前展示无需额外标记，保持为空数组便于后续动态配置
export const CAMPUS_MARKERS = [];

// 标记类型对应的颜色
export const MARKER_COLORS = {
  main: '#1E90FF',
  library: '#4169E1',
  chapel: '#FF6B6B',
  teaching: '#1E90FF',
  school: '#FFB84D',
  campus: '#1E90FF',
  dormitory: '#9B59B6',
  default: '#1E90FF',
};

// 底部标签选项
export const BOTTOM_TABS = [
  { id: 'search', icon: '🔍', label: 'Searching' },
  { id: 'building', icon: '🏢', label: 'Building', active: true },
  { id: 'toilet', icon: '🚻', label: 'Toilet' },
  { id: 'dining', icon: '🍽️', label: 'Catering' },
  { id: 'all', icon: '⋯', label: 'All' },
];
