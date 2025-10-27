/**
 * 地图相关常量数据
 */

// 香港浸会大学主校区位置
export const HKBU_LOCATION = {
  latitude: 22.3387,
  latitudeDelta: 0.005,
  longitude: 114.2061,
  longitudeDelta: 0.005,
};

// 校园建筑物标记点
export const CAMPUS_MARKERS = [
  {
    id: '1',
    title: '香港浸会大学',
    subtitle: '主校区',
    coordinate: { latitude: 22.3387, longitude: 114.2061 },
    type: 'main',
  },
  {
    id: '2',
    title: '香港浸会大学 - 邵逸夫图书馆',
    subtitle: '图书馆',
    coordinate: { latitude: 22.3395, longitude: 114.2068 },
    type: 'library',
  },
  {
    id: '3',
    title: '大学礼拜堂',
    subtitle: '礼堂',
    coordinate: { latitude: 22.3380, longitude: 114.2055 },
    type: 'chapel',
  },
  {
    id: '4',
    title: '香港浸会大学 - 教学大楼',
    subtitle: '教学楼',
    coordinate: { latitude: 22.3390, longitude: 114.2063 },
    type: 'teaching',
  },
  {
    id: '5',
    title: '医疗保健学院',
    subtitle: '学院大楼',
    coordinate: { latitude: 22.3375, longitude: 114.2070 },
    type: 'school',
  },
  {
    id: '6',
    title: '浸大校园',
    subtitle: '校舍',
    coordinate: { latitude: 22.3383, longitude: 114.2048 },
    type: 'campus',
  },
  {
    id: '7',
    title: '学生宿舍',
    subtitle: '住宿',
    coordinate: { latitude: 22.3397, longitude: 114.2075 },
    type: 'dormitory',
  },
];

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
