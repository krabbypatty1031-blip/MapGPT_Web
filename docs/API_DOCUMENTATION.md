# MapGPT API 接口文档

## 概述

本文档描述了 MapGPT 前端应用与后端服务器之间的所有 API 接口。

**基础URL**: `https://your-api-endpoint.com`  
**请求超时**: 30秒  
**Content-Type**: `application/json` (除非特别说明)

---

## 1. 聊天接口

### 1.1 发送消息

发送用户消息到 AI 助手并获取回复。

**接口**: `POST /api/chat`

**请求参数**:

```json
{
  "message": "从图书馆到食堂怎么走？",
  "sessionId": "uuid-string",
  "action": "route",
  "images": [
    {
      "id": "image-1",
      "url": "https://cdn.example.com/images/abc123.jpg"
    }
  ],
  "context": {
    "location": {
      "lat": 22.3378,
      "lng": 114.1420
    },
    "previousAction": "location"
  },
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户输入的消息内容 |
| sessionId | string | 否 | 会话ID，用于维持上下文 |
| action | string | 否 | 快捷功能类型：`route`(路线规划), `location`(智能找点), `image`(拍图提问), `voice`(语音讲解) |
| images | array | 否 | 上传的图片列表 |
| context | object | 否 | 额外的上下文信息 |
| timestamp | string | 是 | 请求时间戳 (ISO 8601格式) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "从图书馆到南翼食堂，建议路线如下：\n1. 从图书馆南门出发\n2. 沿中央大道向南走约150米\n3. 在第二个路口右转\n4. 步行100米即可到达南翼食堂\n\n预计步行时间：3-5分钟",
    "suggestions": ["查看地图", "其他路线", "食堂营业时间"],
    "timestamp": "2025-10-29T12:00:01.000Z",
    "type": "route",
    "metadata": {
      "route": {
        "distance": 250,
        "duration": 240,
        "steps": [...]
      }
    }
  }
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| data.message | string | AI 回复的消息内容 |
| data.suggestions | array | 建议的后续操作 |
| data.type | string | 响应类型：`text`, `route`, `location`, `poi` |
| data.metadata | object | 额外的结构化数据（如路线信息、POI详情等） |

---

### 1.2 获取聊天历史

获取指定会话的历史消息记录。

**接口**: `GET /api/chat/history/{sessionId}`

**URL参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话ID |

**请求示例**:

```
GET /api/chat/history/uuid-session-123
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-123",
    "messages": [
      {
        "id": "msg-1",
        "type": "user",
        "text": "图书馆开放时间",
        "timestamp": "2025-10-29T11:00:00.000Z"
      },
      {
        "id": "msg-2",
        "type": "ai",
        "text": "图书馆开放时间：\n周一至周五：8:00-22:00\n周末：9:00-18:00",
        "timestamp": "2025-10-29T11:00:01.000Z"
      }
    ],
    "total": 2
  }
}
```

---

### 1.3 删除会话

删除指定会话及其所有消息记录。

**接口**: `DELETE /api/chat/session/{sessionId}`

**URL参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话ID |

**响应示例**:

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

## 2. 语音接口

### 2.1 语音转文字

将语音录音转换为文字。

**接口**: `POST /api/voice/speech-to-text`

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio | file | 是 | 音频文件 (m4a格式) |
| language | string | 否 | 语言代码，默认 `zh-CN`，可选 `en-US` |
| actionType | string | 否 | 功能类型，用于优化识别结果 |

**请求示例** (FormData):

```javascript
const formData = new FormData();
formData.append('audio', {
  uri: 'file:///path/to/recording.m4a',
  type: 'audio/m4a',
  name: 'recording.m4a'
});
formData.append('language', 'zh-CN');
formData.append('actionType', 'route');
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "text": "从图书馆到食堂怎么走",
    "confidence": 0.95,
    "language": "zh-CN",
    "duration": 2.3
  }
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 识别出的文字 |
| confidence | number | 置信度 (0-1) |
| language | string | 检测到的语言 |
| duration | number | 音频时长（秒） |

---

### 2.2 文字转语音

将文字转换为语音音频。

**接口**: `POST /api/voice/text-to-speech`

**请求参数**:

```json
{
  "text": "欢迎来到香港浸会大学",
  "voiceType": "female",
  "language": "zh-CN",
  "speed": 1.0
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| text | string | 是 | - | 要转换的文字 |
| voiceType | string | 否 | female | 音色类型：`male`, `female` |
| language | string | 否 | zh-CN | 语言代码 |
| speed | number | 否 | 1.0 | 语速 (0.5-2.0) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "audioUrl": "https://cdn.example.com/audio/tts_abc123.mp3",
    "duration": 3.5,
    "format": "mp3"
  }
}
```

---

## 3. 图片接口

### 3.1 上传图片

上传用户拍摄或选择的图片。

**接口**: `POST /api/upload/image`

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 图片文件 (JPEG/PNG) |

**请求示例** (FormData):

```javascript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "imageId": "img-abc123",
    "url": "https://cdn.example.com/images/abc123.jpg",
    "thumbnail": "https://cdn.example.com/images/abc123_thumb.jpg",
    "size": 245678,
    "width": 1920,
    "height": 1080
  }
}
```

---

### 3.2 图片分析

分析上传的图片内容。

**接口**: `POST /api/vision/analyze`

**请求参数**:

```json
{
  "imageUrl": "https://cdn.example.com/images/abc123.jpg",
  "analysisType": "landmark"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imageUrl | string | 是 | 图片URL |
| analysisType | string | 否 | 分析类型：`landmark`(地标识别), `ocr`(文字识别), `object`(物体识别) |

**响应示例** (地标识别):

```json
{
  "success": true,
  "data": {
    "type": "landmark",
    "results": [
      {
        "name": "香港浸会大学图书馆",
        "confidence": 0.92,
        "description": "建于1994年，是学校的主要学习资源中心",
        "location": {
          "lat": 22.3378,
          "lng": 114.1420
        }
      }
    ]
  }
}
```

---

## 4. 地图接口

### 4.1 路线规划

获取两点之间的导航路线。

**接口**: `POST /api/map/route`

**请求参数**:

```json
{
  "start": {
    "lat": 22.3378,
    "lng": 114.1420,
    "name": "图书馆"
  },
  "end": {
    "lat": 22.3390,
    "lng": 114.1435,
    "name": "南翼食堂"
  },
  "mode": "walking"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | object | 是 | 起点坐标和名称 |
| end | object | 是 | 终点坐标和名称 |
| mode | string | 否 | 出行方式：`walking`, `driving`, `transit` |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 250,
      "duration": 240,
      "steps": [
        {
          "instruction": "从图书馆南门出发",
          "distance": 50,
          "duration": 48,
          "polyline": "encoded_polyline_string"
        },
        {
          "instruction": "沿中央大道向南走150米",
          "distance": 150,
          "duration": 144,
          "polyline": "encoded_polyline_string"
        },
        {
          "instruction": "在第二个路口右转",
          "distance": 0,
          "duration": 0
        },
        {
          "instruction": "步行100米到达南翼食堂",
          "distance": 50,
          "duration": 48,
          "polyline": "encoded_polyline_string"
        }
      ],
      "polyline": "complete_route_polyline"
    }
  }
}
```

---

### 4.2 获取位置信息

根据坐标获取位置详细信息（逆地理编码）。

**接口**: `GET /api/map/location`

**Query参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | number | 是 | 纬度 |
| lng | number | 是 | 经度 |

**请求示例**:

```
GET /api/map/location?lat=22.3378&lng=114.1420
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "address": "香港浸会大学图书馆",
    "province": "香港特别行政区",
    "city": "香港",
    "district": "九龙",
    "street": "窝打老道",
    "streetNumber": "224号",
    "location": {
      "lat": 22.3378,
      "lng": 114.1420
    }
  }
}
```

---

### 4.3 搜索POI

搜索兴趣点（Point of Interest）。

**接口**: `POST /api/map/search`

**请求参数**:

```json
{
  "keyword": "咖啡厅",
  "location": {
    "lat": 22.3378,
    "lng": 114.1420
  },
  "radius": 1000,
  "category": "dining"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| location | object | 是 | 当前位置坐标 |
| radius | number | 否 | 搜索半径（米），默认1000 |
| category | string | 否 | POI类别：`dining`, `library`, `building`, `service` |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "poi-001",
        "name": "星巴克咖啡（浸大店）",
        "category": "dining",
        "subcategory": "cafe",
        "location": {
          "lat": 22.3385,
          "lng": 114.1425
        },
        "distance": 85,
        "address": "香港浸会大学学生中心1楼",
        "rating": 4.5,
        "openingHours": "07:00-22:00"
      },
      {
        "id": "poi-002",
        "name": "校园咖啡厅",
        "category": "dining",
        "subcategory": "cafe",
        "location": {
          "lat": 22.3380,
          "lng": 114.1418
        },
        "distance": 120,
        "address": "香港浸会大学图书馆2楼",
        "rating": 4.2,
        "openingHours": "08:00-20:00"
      }
    ],
    "total": 2
  }
}
```

---

### 4.4 获取POI详情

获取指定POI的详细信息。

**接口**: `GET /api/map/poi/{poiId}`

**URL参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| poiId | string | 是 | POI ID |

**请求示例**:

```
GET /api/map/poi/poi-001
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "poi-001",
    "name": "星巴克咖啡（浸大店）",
    "category": "dining",
    "subcategory": "cafe",
    "description": "提供咖啡、茶饮及轻食的国际连锁咖啡店",
    "location": {
      "lat": 22.3385,
      "lng": 114.1425
    },
    "address": "香港浸会大学学生中心1楼",
    "phone": "+852 1234 5678",
    "website": "https://www.starbucks.com.hk",
    "openingHours": {
      "monday": "07:00-22:00",
      "tuesday": "07:00-22:00",
      "wednesday": "07:00-22:00",
      "thursday": "07:00-22:00",
      "friday": "07:00-22:00",
      "saturday": "08:00-22:00",
      "sunday": "08:00-20:00"
    },
    "rating": 4.5,
    "reviews": 328,
    "priceLevel": 2,
    "photos": [
      "https://cdn.example.com/photos/poi-001-1.jpg",
      "https://cdn.example.com/photos/poi-001-2.jpg"
    ],
    "amenities": ["wifi", "outdoor_seating", "takeaway"],
    "averageSpend": 45
  }
}
```

---

## 错误处理

所有接口在出错时返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息",
    "details": {
      "field": "具体错误字段",
      "reason": "错误原因"
    }
  }
}
```

### 常见错误代码

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| INVALID_REQUEST | 400 | 请求参数无效 |
| UNAUTHORIZED | 401 | 未授权访问 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 |

---

## 数据类型定义

### Action Types（快捷功能类型）

```typescript
type ActionType = 'route' | 'location' | 'image' | 'voice';
```

- `route`: 路线规划
- `location`: 智能找点
- `image`: 拍图提问
- `voice`: 语音讲解

### Message Types（消息类型）

```typescript
type MessageType = 'text' | 'route' | 'location' | 'poi' | 'image';
```

### POI Categories（POI类别）

```typescript
type POICategory = 'dining' | 'library' | 'building' | 'service' | 'recreation';
```

### Transport Modes（出行方式）

```typescript
type TransportMode = 'walking' | 'driving' | 'transit';
```

---

## 开发环境 Mock 数据

在开发环境下（`__DEV__ === true`），如果后端服务不可用，前端会返回 mock 数据用于测试。Mock 数据会在响应中添加 `isMock: true` 标记。

示例：

```json
{
  "success": true,
  "data": {
    "message": "这是模拟响应数据",
    "suggestions": ["建议1", "建议2"]
  },
  "isMock": true
}
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2025-10-29 | 初始版本 |

---

## 联系方式

如有API相关问题，请联系：
- 邮箱: api-support@example.com
- 文档地址: https://docs.example.com/api
