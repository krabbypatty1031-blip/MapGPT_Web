# API 服务重构总结

**重构日期**: 2025-10-29  
**重构目标**: 统一API调用层，消除冗余，建立清晰的三层架构

---

## 📊 重构前后对比

### ❌ 重构前的问题

#### 1. API 调用逻辑分散

```javascript
// chatService.js 中直接调用 fetch
const response = await fetch(`${API_CONFIG.baseURL}/chat`, {
  method: 'POST',
  headers: API_CONFIG.headers,
  body: JSON.stringify({ message, sessionId, context }),
});

// voiceService.js 中也直接调用 fetch
const response = await fetch(`${VOICE_API_CONFIG.baseURL}/speech-to-text`, {
  method: 'POST',
  body: formData,
});

// AssistantScreen.js 中也有上传逻辑
// TODO: 实际上传到服务器
// const response = await fetch('https://your-api.com/upload', {
//   method: 'POST',
//   body: formData,
// });
```

**问题**：
- ❌ 3个地方都有独立的 fetch 调用代码
- ❌ 错误处理逻辑重复
- ❌ 超时管理不统一
- ❌ 新增接口需要重复编写大量样板代码

#### 2. 文件职责不清晰

```
chatService.js (239行)
  ├── API调用逻辑 (fetch封装)     ← 应该在 api.js
  ├── Mock数据生成                ✅ 业务逻辑，应保留
  └── 预设问题管理                ✅ 业务逻辑，应保留

voiceService.js (440行)
  ├── 录音硬件管理                ✅ 本地功能，应保留
  ├── API调用逻辑 (STT/TTS)       ← 应该在 api.js
  └── 音频播放管理                ✅ 本地功能，应保留

api.js (398行)
  └── 完整的API封装              ✅ 新创建，但未被使用！
```

#### 3. 新创建的 api.js 完全没被使用

```javascript
// api.js 定义了完整的 ChatAPI, VoiceAPI, ImageAPI, MapAPI
// 但是：
// ✅ chatService.js 还在用自己的 fetch
// ✅ voiceService.js 还在用自己的 fetch  
// ✅ AssistantScreen.js 还有 TODO 注释
```

---

### ✅ 重构后的架构

#### 文件结构

```
src/services/
├── api.js (398行)              # 核心API层 - 所有HTTP请求的唯一入口
│   ├── ChatAPI                 # 聊天接口
│   ├── VoiceAPI                # 语音接口
│   ├── ImageAPI                # 图片接口
│   └── MapAPI                  # 地图接口
│
├── chatService.js (200行, -39行)  # 聊天业务逻辑层
│   ├── sendMessage()           # 调用 ChatAPI.sendMessage()
│   ├── getChatHistory()        # 调用 ChatAPI.getHistory()
│   ├── clearChatSession()      # 调用 ChatAPI.deleteSession()
│   ├── generateMockResponse()  # Mock数据生成（保留）
│   └── getPresetQuestions()    # 预设问题（保留）
│
└── voiceService.js (378行, -62行)  # 语音业务逻辑层
    ├── 本地功能（保留）:
    │   ├── requestAudioPermission()
    │   ├── startRecording()
    │   ├── stopRecording()
    │   └── 音频播放管理
    │
    └── API调用（重构）:
        ├── speechToText()      # 调用 VoiceAPI.speechToText()
        ├── textToSpeech()      # 调用 VoiceAPI.textToSpeech()
        └── processVoiceWithAction()
```

#### 代码对比

**Before (chatService.js)**:
```javascript
// ❌ 直接调用 fetch，有重复代码
export const sendMessage = async (message, sessionId, context) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const response = await fetch(`${API_CONFIG.baseURL}/chat`, {
    method: 'POST',
    headers: API_CONFIG.headers,
    signal: controller.signal,
    body: JSON.stringify({ message, sessionId, context, timestamp: new Date().toISOString() }),
  });
  
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    throw new Error(`API错误: ${response.status}`);
  }
  
  const data = await response.json();
  return { success: true, data };
};
```

**After (chatService.js)**:
```javascript
// ✅ 调用统一的 API 层，简洁清晰
import { ChatAPI } from './api';

export const sendMessage = async (message, sessionId, context) => {
  try {
    const result = await ChatAPI.sendMessage({ message, sessionId, context });
    return { success: true, data: result };
  } catch (error) {
    console.error('发送消息失败:', error);
    if (__DEV__) {
      return { success: true, data: generateMockResponse(message), isMock: true };
    }
    return { success: false, error: error.message };
  }
};
```

**代码减少**: 从 30行 → 14行 （-53%）

---

**Before (voiceService.js - STT)**:
```javascript
// ❌ 直接构建 FormData 和调用 fetch
export const speechToText = async (audioUri, options = {}) => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  
  if (options.language) {
    formData.append('language', options.language);
  }
  if (options.actionType) {
    formData.append('actionType', options.actionType);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(`${VOICE_API_CONFIG.baseURL}/speech-to-text`, {
    method: 'POST',
    body: formData,
    signal: controller.signal,
    headers: { 'Accept': 'application/json' },
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`语音识别API错误: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    success: true,
    text: data.text,
    confidence: data.confidence || 0,
    language: data.language,
  };
};
```

**After (voiceService.js - STT)**:
```javascript
// ✅ 调用统一的 API 层
import { VoiceAPI } from './api';

export const speechToText = async (audioUri, options = {}) => {
  try {
    const result = await VoiceAPI.speechToText({
      audioUri,
      language: options.language,
      actionType: options.actionType,
    });

    return {
      success: true,
      text: result.text,
      confidence: result.confidence || 0,
      language: result.language,
    };
  } catch (error) {
    console.error('语音转文字失败:', error);
    
    if (__DEV__) {
      return {
        success: true,
        text: getMockRecognitionText(options.actionType),
        confidence: 0.95,
        isMock: true,
      };
    }
    
    return {
      success: false,
      error: error.message || '语音识别失败',
    };
  }
};
```

**代码减少**: 从 45行 → 28行 （-38%）

---

**Before (AssistantScreen.js - 图片上传)**:
```javascript
// ❌ TODO 注释，没有实际实现
const uploadImage = async (image, index) => {
  // 模拟上传进度
  const simulateProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
        if (progress >= 90) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  await simulateProgress();

  // TODO: 实际上传到服务器
  // const formData = new FormData();
  // formData.append('file', { uri: image.uri, type: 'image/jpeg', name: `image_${image.id}.jpg` });
  // const response = await fetch('https://your-api.com/upload', { method: 'POST', body: formData });

  setImages(prev => prev.map(img => 
    img.id === image.id ? { ...img, uploading: false, progress: 100 } : img
  ));
};
```

**After (AssistantScreen.js - 图片上传)**:
```javascript
// ✅ 实际调用 ImageAPI，支持真实进度
import { ImageAPI } from '../services/api';

const uploadImage = async (image, index) => {
  try {
    const result = await ImageAPI.uploadImage({
      uri: image.uri,
      imageId: image.id,
      onProgress: (progress) => {
        setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
      },
    });

    setImages(prev => prev.map(img => 
      img.id === image.id 
        ? { ...img, uploading: false, progress: 100, url: result.url } 
        : img
    ));
    
    console.log('图片上传成功:', result);
  } catch (error) {
    console.error('上传图片失败:', error);
    setImages(prev => prev.map(img =>
      img.id === image.id ? { ...img, uploading: false, error: true } : img
    ));
    alert('图片上传失败，请重试');
  }
};
```

**变化**: 从模拟代码 → 真实 API 调用，支持进度回调

---

## 📈 重构成果统计

### 代码行数变化

| 文件 | 重构前 | 重构后 | 变化 |
|------|--------|--------|------|
| api.js | 0行（不存在使用） | 398行（被使用） | **+398** ✅ |
| chatService.js | 239行 | 200行 | **-39** ✅ |
| voiceService.js | 440行 | 378行 | **-62** ✅ |
| AssistantScreen.js | TODO注释 | 实际代码 | **功能完善** ✅ |

**总计**: 净增 **297行**，但消除了 **大量重复代码**

### 重复代码消除

| 功能 | 重复次数（重构前） | 重复次数（重构后） |
|------|-------------------|-------------------|
| fetch 封装 | 3处 | **1处** ✅ |
| AbortController 超时处理 | 2处 | **1处** ✅ |
| FormData 构建 | 2处 | **1处** ✅ |
| 错误处理逻辑 | 分散 | **统一** ✅ |

---

## 🏗️ 三层架构

### 第一层：核心 API 层 (api.js)

**职责**: 封装所有 HTTP 请求，提供统一的底层接口

```javascript
// 统一的请求封装
const request = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

**导出的 API 模块**:
- `ChatAPI` - 聊天接口（3个方法）
- `VoiceAPI` - 语音接口（2个方法）
- `ImageAPI` - 图片接口（2个方法）
- `MapAPI` - 地图接口（4个方法）

---

### 第二层：业务逻辑层 (chatService, voiceService)

**职责**: 封装业务逻辑、Mock数据、调用底层API

```javascript
// chatService.js - 调用 ChatAPI
import { ChatAPI } from './api';

export const sendMessage = async (message, sessionId, context) => {
  try {
    const result = await ChatAPI.sendMessage({ message, sessionId, context });
    return { success: true, data: result };
  } catch (error) {
    // 业务层的 Mock 逻辑
    if (__DEV__) {
      return { success: true, data: generateMockResponse(message), isMock: true };
    }
    return { success: false, error: error.message };
  }
};
```

**保留的业务逻辑**:
- Mock 数据生成 (chatService.js)
- 预设问题管理 (chatService.js)
- 录音硬件管理 (voiceService.js)
- 音频播放管理 (voiceService.js)

---

### 第三层：应用层 (Hooks, Components)

**职责**: 使用业务层或直接使用API层

```javascript
// useChat.js - 使用 chatService
import { sendMessage as sendMessageAPI } from '../services/chatService';

export const useChat = () => {
  const sendMessage = async (text, action, images) => {
    const response = await sendMessageAPI(text);
    // UI 逻辑...
  };
};

// AssistantScreen.js - 直接使用 ImageAPI
import { ImageAPI } from '../services/api';

const uploadImage = async (image) => {
  await ImageAPI.uploadImage({ uri: image.uri, onProgress: setProgress });
};
```

---

## ✨ 重构带来的好处

### 1. 可维护性提升

**场景**: 修改 API endpoint

**Before**:
```javascript
// 需要修改 3 个地方
// chatService.js
fetch(`${API_CONFIG.baseURL}/chat`, ...)

// voiceService.js
fetch(`${VOICE_API_CONFIG.baseURL}/speech-to-text`, ...)

// AssistantScreen.js (TODO 注释)
// fetch('https://your-api.com/upload', ...)
```

**After**:
```javascript
// 只需修改 1 个地方 (api.js)
const API_ENDPOINTS = {
  CHAT: '/api/chat',                    // ← 只改这里
  SPEECH_TO_TEXT: '/api/voice/stt',     // ← 只改这里
  UPLOAD_IMAGE: '/api/upload/image',    // ← 只改这里
};
```

---

### 2. 一致性保证

**所有 API 调用遵循相同的模式**:

```javascript
// 统一的调用方式
try {
  const result = await ChatAPI.sendMessage({ ... });
  const result = await VoiceAPI.speechToText({ ... });
  const result = await ImageAPI.uploadImage({ ... });
  const result = await MapAPI.getRoute({ ... });
} catch (error) {
  // 统一的错误处理
}
```

---

### 3. 易于扩展

**添加新的 API 接口**:

**Before**: 需要在各个 service 文件中添加 fetch 逻辑  
**After**: 只需在 api.js 中添加一个方法

```javascript
// api.js - 新增功能
export const NotificationAPI = {
  getNotifications: async () => {
    return await request('/api/notifications');
  },
  
  markAsRead: async (notificationId) => {
    return await request(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },
};
```

---

### 4. 测试友好

**单元测试变得更容易**:

```javascript
// 可以轻松 mock api.js
jest.mock('../services/api', () => ({
  ChatAPI: {
    sendMessage: jest.fn(() => Promise.resolve({ message: 'test' })),
  },
}));

// 测试业务逻辑
test('sendMessage should return mock data in dev', async () => {
  const result = await chatService.sendMessage('hello');
  expect(result.isMock).toBe(true);
});
```

---

## 📋 重构清单

### ✅ 已完成

- [x] 创建统一的 `api.js` 核心 API 层
- [x] 重构 `chatService.js` 使用 `ChatAPI`
- [x] 重构 `voiceService.js` 使用 `VoiceAPI`
- [x] 更新 `AssistantScreen.js` 使用 `ImageAPI`
- [x] 保留业务逻辑（Mock数据、预设问题、录音管理）
- [x] 消除重复的 fetch 封装代码
- [x] 统一错误处理和超时管理
- [x] 创建 API 架构文档 (`API_SERVICE_STRUCTURE.md`)
- [x] 创建重构总结文档（本文件）
- [x] 验证代码无错误

### 📝 文档产出

1. **API_DOCUMENTATION.md** - 完整的 API 接口文档
2. **API_SERVICE_STRUCTURE.md** - API 服务架构说明
3. **REFACTORING_SUMMARY.md** - 重构总结（本文件）

---

## 🔄 数据流向

### 聊天消息流程

```
用户输入 "图书馆在哪里"
         ↓
AssistantScreen.js
         ↓
useChat.sendMessage()
         ↓
chatService.sendMessage()
         ↓
ChatAPI.sendMessage()  ← api.js
         ↓
request('/api/chat', { method: 'POST', body: ... })
         ↓
fetch(`${baseURL}/api/chat`, ...)
         ↓
后端 API Server
         ↓
返回: { message: "图书馆在...", suggestions: [...] }
         ↓
ChatAPI 返回数据
         ↓
chatService 处理（或返回Mock）
         ↓
useChat 更新 messages 状态
         ↓
UI 显示 AI 回复
```

### 语音识别流程

```
用户点击录音
         ↓
AssistantScreen.js
         ↓
VoiceService.startRecording()  ← 本地录音
         ↓
... 录音中 ...
         ↓
VoiceService.stopRecording()  ← 本地停止
         ↓
返回 audioUri
         ↓
VoiceService.speechToText(audioUri)
         ↓
VoiceAPI.speechToText({ audioUri })  ← api.js
         ↓
request('/api/voice/speech-to-text', FormData)
         ↓
后端 API Server (语音识别)
         ↓
返回: { text: "从图书馆到食堂", confidence: 0.95 }
         ↓
VoiceAPI 返回数据
         ↓
VoiceService 处理（或返回Mock）
         ↓
AssistantScreen 获取识别文本
         ↓
调用 sendMessage 发送消息
```

### 图片上传流程

```
用户选择图片
         ↓
AssistantScreen.handleImagePress()
         ↓
ImagePicker.launchImageLibraryAsync()
         ↓
获取 imageUri
         ↓
uploadImage(image)
         ↓
ImageAPI.uploadImage({ uri, onProgress })  ← api.js
         ↓
XMLHttpRequest + FormData
         ↓
onProgress 回调 → 更新进度条
         ↓
后端 API Server
         ↓
返回: { imageId, url, thumbnail, size, width, height }
         ↓
ImageAPI 返回数据
         ↓
AssistantScreen 更新图片状态（url, progress: 100）
         ↓
UI 显示上传成功
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **新增 API 接口时**:
   ```javascript
   // 1. 在 api.js 中添加
   export const NewAPI = {
     newMethod: async (params) => {
       return await request('/api/new', { method: 'POST', body: JSON.stringify(params) });
     },
   };
   
   // 2. 如果需要业务逻辑，创建 newService.js
   import { NewAPI } from './api';
   export const doSomething = async () => {
     const result = await NewAPI.newMethod();
     // 业务逻辑...
     return processedResult;
   };
   
   // 3. 在组件中使用
   import { doSomething } from '../services/newService';
   const result = await doSomething();
   ```

2. **错误处理**:
   ```javascript
   // ✅ 在业务层捕获并处理
   export const sendMessage = async (message) => {
     try {
       return await ChatAPI.sendMessage({ message });
     } catch (error) {
       console.error('发送失败:', error);
       // 提供降级方案
       if (__DEV__) return mockData;
       throw error;
     }
   };
   ```

3. **Mock 数据**:
   ```javascript
   // ✅ 在业务层（Service）添加 Mock 逻辑
   if (__DEV__) {
     return { data: generateMockData(), isMock: true };
   }
   
   // ❌ 不要在 api.js 中添加 Mock 逻辑
   ```

---

### ❌ 避免做法

1. **不要绕过 api.js 直接调用 fetch**:
   ```javascript
   // ❌ 错误
   const response = await fetch('/api/chat', { method: 'POST', ... });
   
   // ✅ 正确
   const result = await ChatAPI.sendMessage({ ... });
   ```

2. **不要在 api.js 中添加业务逻辑**:
   ```javascript
   // ❌ 错误 - api.js 中不应有业务逻辑
   export const ChatAPI = {
     sendMessage: async (params) => {
       const result = await request('/api/chat', ...);
       if (result.type === 'route') {
         // 业务逻辑不应该在这里
         return processRouteData(result);
       }
       return result;
     },
   };
   
   // ✅ 正确 - 业务逻辑放在 Service 层
   export const ChatAPI = {
     sendMessage: async (params) => {
       return await request('/api/chat', ...);  // 只负责请求
     },
   };
   ```

3. **不要在多个 Service 中重复相同的 API 调用**:
   ```javascript
   // ❌ 错误 - chatService.js
   await fetch('/api/upload', ...);
   
   // ❌ 错误 - imageService.js  
   await fetch('/api/upload', ...);
   
   // ✅ 正确 - 统一使用 ImageAPI
   await ImageAPI.uploadImage({ ... });
   ```

---

## 📊 性能影响

### 理论分析

**额外开销**: 多一层函数调用  
**实际影响**: 可忽略不计 (~0.001ms per call)

**收益**:
- ✅ 统一的错误处理（减少崩溃）
- ✅ 统一的超时管理（避免卡死）
- ✅ 代码复用（减少包体积）

**结论**: 性能影响微乎其微，架构收益显著

---

## 🔮 未来扩展建议

### 1. TypeScript 类型定义

```typescript
// api.types.ts
export interface ChatMessage {
  message: string;
  sessionId?: string;
  action?: 'route' | 'location' | 'image' | 'voice';
  images?: Array<{ id: string; url: string }>;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  timestamp: string;
  type: 'text' | 'route' | 'location' | 'poi';
  metadata?: any;
}

// api.ts
export const ChatAPI = {
  sendMessage: async (params: ChatMessage): Promise<ChatResponse> => {
    return await request('/api/chat', { ... });
  },
};
```

### 2. 请求拦截器

```javascript
// api.js
const requestInterceptors = [];
const responseInterceptors = [];

export const addRequestInterceptor = (interceptor) => {
  requestInterceptors.push(interceptor);
};

const request = async (endpoint, options) => {
  // 应用请求拦截器
  let finalOptions = options;
  for (const interceptor of requestInterceptors) {
    finalOptions = await interceptor(finalOptions);
  }
  
  const response = await fetch(...);
  
  // 应用响应拦截器
  let finalData = data;
  for (const interceptor of responseInterceptors) {
    finalData = await interceptor(finalData);
  }
  
  return finalData;
};

// 使用示例 - 自动添加 token
addRequestInterceptor(async (options) => {
  const token = await getAuthToken();
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  };
});
```

### 3. 请求缓存

```javascript
// api.js
const cache = new Map();

export const ChatAPI = {
  getHistory: async (sessionId) => {
    const cacheKey = `history_${sessionId}`;
    
    // 检查缓存
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {  // 1分钟缓存
        return cached.data;
      }
    }
    
    // 请求数据
    const data = await request(`/api/chat/history/${sessionId}`);
    
    // 存入缓存
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  },
};
```

### 4. 请求重试

```javascript
// api.js
const requestWithRetry = async (endpoint, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await request(endpoint, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export const ChatAPI = {
  sendMessage: async (params) => {
    return await requestWithRetry('/api/chat', { ... }, 3);
  },
};
```

---

## 📞 联系方式

如有关于重构的问题或建议，请联系：
- 项目负责人: [Your Name]
- 文档维护: [Your Email]

---

**重构完成时间**: 2025-10-29  
**版本**: 2.0.0  
**重构者**: AI Assistant + Development Team
