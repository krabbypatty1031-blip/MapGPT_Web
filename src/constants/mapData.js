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
    latitude: 22.3387,
    longitude: 114.2061,
    type: 'main',
    position: '九龙塘',
    features: '主要行政楼，设有校长办公室、教务处、学生事务处',
    description: '浸会大学主校区的中心建筑，是学校行政管理的核心区域。',
  },
  {
    id: '2',
    title: '邵逸夫图书馆',
    subtitle: '图书馆',
    latitude: 22.3395,
    longitude: 114.2068,
    type: 'library',
    position: '主校区中心',
    features: '藏书丰富，提供安静的学习环境，24小时开放',
    description: '现代化图书馆，配备电子资源、自习室和研讨室，是学生学习的理想场所。',
  },
  {
    id: '3',
    title: '大学礼拜堂',
    subtitle: '礼堂',
    latitude: 22.3380,
    longitude: 114.2055,
    type: 'chapel',
    position: '校园西侧',
    features: '可容纳500人，用于宗教活动和大型讲座',
    description: '庄严肃穆的礼拜堂，经常举办各类宗教仪式和学术讲座。',
  },
  {
    id: '4',
    title: '教学大楼',
    subtitle: '教学楼',
    latitude: 22.3390,
    longitude: 114.2063,
    type: 'teaching',
    position: '主校区东侧',
    features: '配备多媒体教室、计算机实验室、语言实验室',
    description: '现代化教学设施，提供优质的教学环境，是学生上课的主要场所。',
  },
  {
    id: '5',
    title: '医疗保健学院',
    subtitle: '学院大楼',
    latitude: 22.3375,
    longitude: 114.2070,
    type: 'school',
    position: '校园南部',
    features: '专业实验室、临床培训设施、研究中心',
    description: '医疗保健学院的专属教学楼，拥有先进的医疗培训设备。',
  },
  {
    id: '6',
    title: '学生活动中心',
    subtitle: '校舍',
    latitude: 22.3383,
    longitude: 114.2048,
    type: 'campus',
    position: '校园西北角',
    features: '学生社团办公室、活动室、咖啡厅',
    description: '学生课外活动的聚集地，充满活力和创意。',
  },
  {
    id: '7',
    title: '学生宿舍',
    subtitle: '住宿',
    latitude: 22.3397,
    longitude: 114.2075,
    type: 'dormitory',
    position: '校园东北角',
    features: '现代化住宿设施，提供单人间和双人间',
    description: '舒适安全的住宿环境，配备完善的生活设施和学习空间。',
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
