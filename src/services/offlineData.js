/**
 * 离线模式核心数据与工具
 * 提供模拟接口所需的静态数据、生成函数以及统一的延迟控制
 */

import { CAMPUS_MARKERS } from '../constants/mapData';
import { calculateDistance } from './locationService';

const DEFAULT_DELAY = { min: 180, max: 420 };

const chatHistoryStore = new Map();

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulateLatency = async (payload, delay = DEFAULT_DELAY) => {
  const span = delay.max - delay.min;
  const duration = delay.min + Math.random() * (span <= 0 ? 1 : span);
  await wait(duration);
  return typeof payload === 'function' ? payload() : payload;
};

export const persistChatHistory = (sessionId, userMessage, assistantMessage) => {
  if (!sessionId) return;
  const history = chatHistoryStore.get(sessionId) || [];
  if (userMessage) {
    history.push({
      id: `${sessionId}-user-${history.length + 1}`,
      role: 'user',
      text: userMessage,
      timestamp: new Date().toISOString(),
    });
  }
  if (assistantMessage) {
    history.push({
      id: `${sessionId}-ai-${history.length + 1}`,
      role: 'assistant',
      text: assistantMessage.text,
      timestamp: new Date().toISOString(),
      metadata: assistantMessage.metadata,
    });
  }
  chatHistoryStore.set(sessionId, history.slice(-20));
};

export const readChatHistory = (sessionId) => chatHistoryStore.get(sessionId) || [];
export const clearChatHistory = (sessionId) => chatHistoryStore.delete(sessionId);

export const ROUTE_LOCATIONS = [
  {
    id: 'hkbu-center',
    name: '邵逸夫图书馆',
    type: 'library',
    features: '24 小时学习区、数字资源中心、自习室',
    latitude: 22.34019,
    longitude: 114.18021,
    description: '图书馆提供丰富的实体与电子资源，是学生备考与研究的核心。',
  },
];

const CHAT_SNIPPETS = [
  {
    keywords: ['图书馆', 'library', '借书', 'book'],
    message:
      '📚 邵逸夫图书馆今日 08:00-22:00 开放，提供自习室、研讨室以及打印复印等服务。入口在中庭右侧。',
    suggestions: ['预约座位', '查询图书', '学习空间'],
  },
  {
    keywords: ['食堂', '餐厅', '吃', 'dining'],
    message:
      '🍜 今日推荐南翼食堂亮点菜单：\n- 港式烧味套餐\n- 健康轻食沙拉\n- 手作豆乳咖啡\n午市 11:00-14:30，人均 35 港币。',
    suggestions: ['今日菜品', '人流情况', '附近咖啡厅'],
  },
  {
    keywords: ['活动', 'event', '讲座', '展览'],
    message:
      '🎉 本周活动：\n周三 16:00 社团招新 @ 中央广场\n周五 19:30 原创音乐会 @ 大礼堂\n可通过校园 App 预约席位。',
    suggestions: ['报名方式', '更多活动', '提醒我'],
  },
  {
    keywords: ['路线', '导航', '怎么走', 'route'],
    message:
      '🧭 我已为你规划校园步行路线，平均用时 6 分钟。沿中央广场直行即可看到指引路牌。',
    suggestions: ['查看地图', '替换终点', '发送至手机'],
  },
];

const FALLBACK_CHAT = {
  message:
    '您好，我是 MapGPT 校园助手，可以帮你查询开放时间、路线导航、校园活动及学习空间。请告诉我你想了解的内容。',
  suggestions: ['校内路线', '图书馆开放', '附近餐饮', '本周活动'],
};

export const buildChatReply = (message, action) => {
  const lower = (message || '').toLowerCase();
  const matched =
    CHAT_SNIPPETS.find((snippet) =>
      snippet.keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
    ) || FALLBACK_CHAT;

  const routeAddon =
    action === 'route'
      ? '\n\n🚶 已生成离线路线，可点击「查看地图」查看路径详情。'
      : '';

  const locationAddon =
    action === 'location'
      ? '\n\n📍 我在地图上高亮了相关地点，支持一键导航。'
      : '';

  const imageAddon =
    action === 'image'
      ? '\n\n🖼️ 根据图片特征，我为你列出了参考信息与可能的建筑。'
      : '';

  const voiceAddon =
    action === 'voice'
      ? '\n\n🔊 已为你准备语音讲解，随时可以播放。'
      : '';

  const content = `${matched.message}${routeAddon}${locationAddon}${imageAddon}${voiceAddon}`;

  return {
    text: content,
    suggestions: matched.suggestions || FALLBACK_CHAT.suggestions,
    locations: action === 'route' ? ROUTE_LOCATIONS : undefined,
  };
};

const createPolygonAround = (marker, delta = 0.00018) => {
  const { latitude, longitude } = marker;
  const coords = [
    [longitude - delta, latitude - delta],
    [longitude + delta, latitude - delta],
    [longitude + delta, latitude + delta],
    [longitude - delta, latitude + delta],
    [longitude - delta, latitude - delta],
  ];
  return {
    type: 'Feature',
    id: `building-${marker.id}`,
    properties: {
      id: marker.id,
      name: marker.title,
      category: marker.type,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
};

const createRoadPolygon = (start, end, padding = 0.00012) => {
  const latMin = Math.min(start.latitude, end.latitude) - padding;
  const latMax = Math.max(start.latitude, end.latitude) + padding;
  const lonMin = Math.min(start.longitude, end.longitude) - padding;
  const lonMax = Math.max(start.longitude, end.longitude) + padding;
  return {
    type: 'Feature',
    properties: {
      type: 'path',
      start: start.title,
      end: end.title,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lonMin, latMin],
          [lonMax, latMin],
          [lonMax, latMax],
          [lonMin, latMax],
          [lonMin, latMin],
        ],
      ],
    },
  };
};

const BUILDING_FEATURES = CAMPUS_MARKERS.map(createPolygonAround);

const ROAD_FEATURES = CAMPUS_MARKERS.slice(0, CAMPUS_MARKERS.length - 1).map((marker, index) =>
  createRoadPolygon(marker, CAMPUS_MARKERS[index + 1]),
);

const withinBounds = (marker, bounds) => {
  if (!bounds) return true;
  return (
    marker.latitude >= bounds.minLat &&
    marker.latitude <= bounds.maxLat &&
    marker.longitude >= bounds.minLon &&
    marker.longitude <= bounds.maxLon
  );
};

export const getBuildingFeatureCollection = (bounds) => ({
  type: 'FeatureCollection',
  features: BUILDING_FEATURES.filter((feature) => {
    const marker = CAMPUS_MARKERS.find((m) => `building-${m.id}` === feature.id);
    return marker ? withinBounds(marker, bounds) : true;
  }),
});

export const getRoadFeatureCollection = (bounds) => ({
  type: 'FeatureCollection',
  features: ROAD_FEATURES.filter((feature, index) => {
    const marker = CAMPUS_MARKERS[index];
    return marker ? withinBounds(marker, bounds) : true;
  }),
});

const toCoordinatePairs = (start, end) => {
  const mid = {
    latitude: (start.latitude + end.latitude) / 2 + 0.00045,
    longitude: (start.longitude + end.longitude) / 2 + randomBetween(-20, 20) * 1e-5,
  };

  const arc = [
    [start.longitude, start.latitude],
    [mid.longitude, mid.latitude],
    [end.longitude, end.latitude],
  ];

  return arc;
};

export const buildOfflineRoute = (start, end) => {
  const coordinates = toCoordinatePairs(start, end);
  const latLngPoints = coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  const distance = latLngPoints.reduce((total, point, index) => {
    if (index === 0) return 0;
    return total + calculateDistance(latLngPoints[index - 1], point);
  }, 0);

  return {
    coordinates,
    info: {
      distance,
      duration: Math.round(distance / 1.35),
      note: '离线路线根据直线距离生成，仅供参考',
    },
  };
};

const NORMALIZED_MARKERS = CAMPUS_MARKERS.map((marker) => ({
  id: marker.id?.toString() ?? marker.title,
  name: marker.title,
  subtitle: marker.subtitle,
  description: marker.description,
  features: marker.features,
  category: marker.type || 'general',
  latitude: marker.latitude,
  longitude: marker.longitude,
}));

export const searchPOIs = ({ keyword = '', category }) => {
  const lower = keyword.toLowerCase();
  return NORMALIZED_MARKERS.filter((marker) => {
    const matchesKeyword =
      !lower ||
      marker.name.toLowerCase().includes(lower) ||
      (marker.description || '').toLowerCase().includes(lower);
    const matchesCategory = !category || marker.category === category;
    return matchesKeyword && matchesCategory;
  });
};

export const getPOIDetail = (poiId) =>
  NORMALIZED_MARKERS.find((marker) => marker.id === poiId || marker.name === poiId);

export const getNearestMarker = ({ latitude, longitude }) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  let winner = null;
  let minDistance = Infinity;
  NORMALIZED_MARKERS.forEach((marker) => {
    const distance = calculateDistance(
      { latitude, longitude },
      { latitude: marker.latitude, longitude: marker.longitude },
    );
    if (distance < minDistance) {
      minDistance = distance;
      winner = marker;
    }
  });
  if (!winner) return null;
  return {
    ...winner,
    distance: minDistance,
  };
};

const IMAGE_ANALYSIS = {
  landmark: {
    caption: '图像包含香港浸会大学教学楼立面，玻璃与金属交错。',
    tags: ['校园', '建筑', '教学楼'],
    recommendations: ['查看楼层平面', '查询开放时段'],
  },
  object: {
    caption: '识别到多名学生在中庭交流，背景有主题展板。',
    tags: ['学生', '交流', '活动'],
    recommendations: ['创建活动提醒', '分享给同伴'],
  },
  ocr: {
    caption: '文字内容：欢迎来到香港浸会大学创意周。',
    tags: ['活动海报', '中文', '宣传'],
    recommendations: ['添加到日历', '查看地图位置'],
  },
};

export const analyzeImageOffline = (analysisType = 'landmark') => {
  const result = IMAGE_ANALYSIS[analysisType] || IMAGE_ANALYSIS.landmark;
  return {
    ...result,
    analysisType,
    confidence: 0.94,
  };
};

export const uploadImageOffline = (uri, imageId) => ({
  imageId,
  url: uri,
  thumbnail: uri,
  uploadedAt: new Date().toISOString(),
});

const VOICE_SNIPPETS = {
  route: '请带我从学生会走到教学楼A座。',
  location: '最近的咖啡厅在哪里？',
  image: '这张照片里是哪栋建筑？',
  voice: '给我讲讲这座建筑的历史故事。',
  default: '你好，可以介绍一下校园里有什么好去处吗？',
};

export const getMockSpeechText = (actionType) => VOICE_SNIPPETS[actionType] || VOICE_SNIPPETS.default;
