# API 服务架构说明

## 📁 服务文件结构

```
src/services/
├── api.js              # 核心API层 - 统一的HTTP请求封装
├── chatService.js      # 聊天业务逻辑层
└── voiceService.js     # 语音业务逻辑层（录音+API调用）
```

---

## 🏗️ 三层架构设计

### 第一层：核心 API 层 (`api.js`)

**职责**：
- 封装所有 HTTP 请求
- 统一错误处理和超时管理
- 提供底层 API 调用接口

**导出模块**：
```javascript
import { ChatAPI, VoiceAPI, ImageAPI, MapAPI } from './api';
```

**包含的API组**：

#### 1. ChatAPI - 聊天接口
```javascript
ChatAPI.sendMessage({ message, sessionId, action, images, context })
ChatAPI.getHistory(sessionId)
ChatAPI.deleteSession(sessionId)
```

#### 2. VoiceAPI - 语音接口
```javascript
VoiceAPI.speechToText({ audioUri, language, actionType })
VoiceAPI.textToSpeech({ text, voiceType, language, speed })
```

#### 3. ImageAPI - 图片接口
```javascript
ImageAPI.uploadImage({ uri, imageId, onProgress })
ImageAPI.analyzeImage({ imageUrl, analysisType })
```

#### 4. MapAPI - 地图接口
```javascript
MapAPI.getRoute({ start, end, mode })
MapAPI.getLocation({ lat, lng })
MapAPI.searchPOI({ keyword, location, radius, category })
MapAPI.getPOIDetail(poiId)
```

---

### 第二层：业务逻辑层

#### A. `chatService.js` - 聊天服务

**职责**：
- 封装聊天相关的业务逻辑
- 提供 Mock 数据生成（开发环境）
- 管理预设问题
- **内部调用 `api.js` 的 ChatAPI**

**导出函数**：
```javascript
import { sendMessage, getChatHistory, clearChatSession, getPresetQuestions } from './chatService';
```

**实现逻辑**：
```javascript
export const sendMessage = async (message, sessionId, context) => {
  try {
    // 调用底层 API
    const result = await ChatAPI.sendMessage({ message, sessionId, context });
    return { success: true, data: result };
  } catch (error) {
    // 开发环境返回 Mock 数据
    if (__DEV__) {
      return { success: true, data: generateMockResponse(message), isMock: true };
    }
    return { success: false, error: error.message };
  }
};
```

**Mock 数据支持**：
- 包含图书馆、路线、食堂、活动等场景的模拟响应
- 开发环境下无需后端即可测试UI

---

#### B. `voiceService.js` - 语音服务

**职责**：
- 管理录音硬件和权限（expo-av）
- 管理音频播放
- 封装语音相关业务逻辑
- **内部调用 `api.js` 的 VoiceAPI**

**导出函数**：
```javascript
import * as VoiceService from './voiceService';

// 录音管理（本地功能，不调用API）
VoiceService.requestAudioPermission()
VoiceService.checkAudioPermission()
VoiceService.startRecording()
VoiceService.stopRecording()
VoiceService.cancelRecording()
VoiceService.getRecordingStatus()

// 语音识别和播放（调用API）
VoiceService.speechToText(audioUri, options)
VoiceService.textToSpeech(text, options)
VoiceService.stopPlayback()

// 业务逻辑
VoiceService.processVoiceWithAction(audioUri, actionType, context)
VoiceService.cleanup()
```

**混合功能设计**：
- **本地功能**：录音控制、权限管理、音频播放
- **API调用**：speechToText、textToSpeech（通过 `api.js` 的 VoiceAPI）

---

### 第三层：应用层（使用方）

#### 1. Hooks - `useChat.js`

```javascript
import { sendMessage as sendMessageAPI } from '../services/chatService';

export const useChat = () => {
  const sendMessage = async (text, action, images) => {
    const response = await sendMessageAPI(text.trim());
    // 处理响应...
  };
};
```

**依赖关系**：
```
useChat.js → chatService.js → api.js (ChatAPI)
```

---

#### 2. 页面组件 - `AssistantScreen.js`

```javascript
import { useChat } from '../hooks/useChat';
import * as VoiceService from '../services/voiceService';
import { ImageAPI } from '../services/api';

// 使用聊天功能
const { messages, sendMessage } = useChat();

// 使用语音功能
const startRecording = async () => {
  await VoiceService.startRecording();
};

const handleStopRecording = async () => {
  const uri = await VoiceService.stopRecording();
  const result = await VoiceService.speechToText(uri, { actionType });
};

// 使用图片上传功能
const uploadImage = async (image) => {
  const result = await ImageAPI.uploadImage({
    uri: image.uri,
    onProgress: (progress) => setProgress(progress)
  });
};
```

**依赖关系**：
```
AssistantScreen.js
  ├── useChat.js → chatService.js → api.js (ChatAPI)
  ├── VoiceService → api.js (VoiceAPI)
  └── ImageAPI (直接使用 api.js)
```

---

## 🔄 数据流向图

```
┌─────────────────────────────────────────────────────────┐
│                   应用层 (UI Components)                 │
│  AssistantScreen.js, MapScreen.js, etc.                 │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Hooks Layer    │  │  Direct Usage   │
│  useChat.js     │  │  ImageAPI       │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    │
┌─────────────────────────────┴────────────────────────┐
│              业务逻辑层 (Service Layer)               │
│  chatService.js          voiceService.js             │
│  - 业务逻辑              - 本地录音管理               │
│  - Mock数据              - 音频播放                   │
│  - 调用 ChatAPI          - 调用 VoiceAPI             │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│              核心 API 层 (api.js)                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │ChatAPI │  │VoiceAPI│  │ImageAPI│  │ MapAPI │    │
│  └────────┘  └────────┘  └────────┘  └────────┘    │
│  - 统一 fetch 封装                                   │
│  - 超时和错误处理                                    │
│  - AbortController                                   │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                  后端 API Server                      │
│  POST /api/chat                                      │
│  GET  /api/chat/history/{sessionId}                  │
│  POST /api/voice/speech-to-text                      │
│  POST /api/upload/image                              │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

---

## ✨ 重构优势

### 重构前的问题：
❌ API 调用逻辑分散在 chatService.js 和 voiceService.js  
❌ 重复的 fetch 封装代码  
❌ 错误处理不统一  
❌ 新功能（如 Image, Map）没有统一规范  

### 重构后的优势：
✅ **单一数据源**：所有 API 调用集中在 `api.js`  
✅ **职责分离**：API层、业务层、应用层各司其职  
✅ **易于维护**：修改 API endpoint 只需改一个地方  
✅ **统一规范**：所有 API 遵循相同的调用模式  
✅ **Mock 支持**：业务层可以提供 Mock 数据，不影响 API 层  
✅ **易于测试**：每层可以独立测试  
✅ **TypeScript 友好**：清晰的接口定义便于添加类型  

---

## 📝 使用示例

### 示例 1：发送聊天消息（带图片）

```javascript
// 在组件中
import { useChat } from '../hooks/useChat';

const MyComponent = () => {
  const { sendMessage } = useChat();
  
  const handleSend = async () => {
    await sendMessage('这是什么建筑？', 'image', [
      { id: '1', url: 'https://cdn.example.com/photo.jpg' }
    ]);
  };
};

// useChat 内部 → chatService.sendMessage()
// chatService 内部 → ChatAPI.sendMessage()
// ChatAPI 内部 → fetch('/api/chat', ...)
```

### 示例 2：语音识别

```javascript
import * as VoiceService from '../services/voiceService';

const handleVoice = async () => {
  // 1. 本地录音
  await VoiceService.startRecording();
  // ... 录音中 ...
  const audioUri = await VoiceService.stopRecording();
  
  // 2. 调用 API 识别
  const result = await VoiceService.speechToText(audioUri, {
    language: 'zh-CN',
    actionType: 'route'
  });
  
  console.log('识别结果:', result.text);
};

// VoiceService.speechToText() 内部 → VoiceAPI.speechToText()
// VoiceAPI 内部 → fetch('/api/voice/speech-to-text', ...)
```

### 示例 3：图片上传（带进度）

```javascript
import { ImageAPI } from '../services/api';

const handleUpload = async (imageUri) => {
  const result = await ImageAPI.uploadImage({
    uri: imageUri,
    imageId: 'img-123',
    onProgress: (progress) => {
      console.log(`上传进度: ${progress}%`);
      setUploadProgress(progress);
    }
  });
  
  console.log('上传成功:', result.url);
};

// ImageAPI.uploadImage() → XMLHttpRequest + FormData
```

### 示例 4：地图路线规划

```javascript
import { MapAPI } from '../services/api';

const handleRoute = async () => {
  const route = await MapAPI.getRoute({
    start: { lat: 22.3378, lng: 114.1420, name: '图书馆' },
    end: { lat: 22.3390, lng: 114.1435, name: '食堂' },
    mode: 'walking'
  });
  
  console.log('路线距离:', route.distance);
  console.log('预计时间:', route.duration);
};

// MapAPI.getRoute() → fetch('/api/map/route', ...)
```

---

## 🔧 配置说明

### API 基础 URL 配置

在 `api.js` 中：

```javascript
const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'https://your-api-endpoint.com',
  timeout: 30000,
};
```

**环境变量设置**（`.env` 文件）：
```
API_BASE_URL=https://api.mapgpt.hkbu.edu.hk
```

---

## 🧪 开发环境 Mock 数据

在开发环境（`__DEV__ === true`）下，当后端服务不可用时：

1. **chatService.js** 会返回 Mock 聊天响应
2. **voiceService.js** 会返回 Mock 语音识别文本
3. Mock 响应会添加 `isMock: true` 标记

示例：
```javascript
{
  success: true,
  data: {
    message: "模拟的AI回复",
    suggestions: ["建议1", "建议2"]
  },
  isMock: true  // 标识这是 Mock 数据
}
```

---

## 📚 参考文档

- [完整 API 接口文档](./API_DOCUMENTATION.md)
- [快速开始指南](./QUICK_START.md)
- [项目总结](./PROJECT_SUMMARY.md)

---

## 🔄 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2025-10-29 | 重构：统一API层，分离业务逻辑 |
| 1.0.0 | 2025-10-28 | 初始版本（分散式API调用） |

---

## ⚠️ 注意事项

1. **不要绕过 api.js 直接调用 fetch**
   - ❌ 错误：在组件中直接 `fetch('/api/chat', ...)`
   - ✅ 正确：使用 `ChatAPI.sendMessage()` 或 `chatService.sendMessage()`

2. **业务逻辑放在 Service 层，不要放在 api.js**
   - ❌ 错误：在 api.js 中添加 Mock 数据生成
   - ✅ 正确：在 chatService.js 中处理 Mock 逻辑

3. **voiceService.js 的双重职责**
   - 本地功能（录音）和 API 调用（识别）都在这个文件
   - 这是合理的，因为录音和识别是紧密相关的业务流程

4. **直接使用 api.js 的情况**
   - 对于简单的 API 调用（如 ImageAPI, MapAPI），可以直接在组件中使用
   - 如果需要业务逻辑封装，应该创建对应的 Service 文件

---

最后更新: 2025-10-29
