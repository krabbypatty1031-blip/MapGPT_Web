// 地图配置
export const MAP_CONFIG = {
  // 地图提供商: 'webview' 使用 OSM (无需 API Key), 'mapview' 使用 Google Maps (需要 API Key)
  provider: 'webview', // 'webview' | 'mapview'
  
  // 默认地图中心（香港浸会大学）
  defaultCenter: {
    latitude: 22.3388,
    longitude: 114.1765,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  
  // WebView (OSM) 配置
  webview: {
    tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // OSM 瓦片服务器
    attribution: '© OpenStreetMap contributors',
  },
  
  // MapView (Google Maps) 配置
  mapview: {
    // 如果有 API Key，在这里配置
    apiKey: 'YOUR_API_KEY',
  },
};
