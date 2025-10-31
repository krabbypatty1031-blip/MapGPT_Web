# MapGPT 前端 — 后端 API 对齐文档

> 版本：dev 分支同步文件（基于 `src/services/api.js`）

## 基础信息
- Base URL: `http://localhost:8000`（由前端常量 `API_BASE_URL` 指定）
- 全局超时: 30000 ms（`API_TIMEOUT`）
- 全部响应包装：前端 `request` 函数期望后端返回可被 `response.json()` 解析的 JSON；前端再把它包装为 `{ success: true, data }` 或在出错时 `{ success: false, error }`。

注意：后端应返回标准的 JSON 响应体以便前端解析。下面示例以后端直接返回业务对象为准，实际前端会再包一层 `success/data`。

---

## 全局约定
- 默认 Content-Type: `application/json`（POST/PUT 的 JSON body）。
- 文件/音频上传使用 `multipart/form-data`，字段名请对齐为接口说明中要求的字段（例如 `file` 或 `audio`）。
- 对于 multipart 上传，不要在客户端显式设置 `Content-Type: multipart/form-data`（因为边界 boundary 由 runtime 自动生成），除非你在低层 XHR 场景并能正确管理 boundary。
- 错误应返回合适的 HTTP 状态码并带 JSON 错误体，例如 `{ "message": "描述" }`。

---

## API 列表（与 `src/services/api.js` 对齐）
下面每一节包含：端点常量名、路径（相对于 Base URL）、HTTP 方法、请求说明、响应示例、以及注意事项。

### 1) 聊天 API

#### CHAT_SEND
- 路径：`POST /api/chat`
- 请求体（JSON）:
  - message: string — 用户消息文本
  - sessionId: string — 会话 ID，可选用于拉取会话上下文或新建会话
  - action: string — 快捷功能类型，可能值示例：`route` / `location` / `image` / `voice`
  - images: Array<{ id: string, url: string }> — 图片列表（前端会将图片对象映射为此结构）
  - context: Object — 任意上下文信息（例如当前位置信息、最后一次交互等）
  - timestamp: string (ISO) — 发送时间（前端会填）

- 成功响应示例（后端直接返回的业务数据示例）：

  {
    "messageId": "msg_123",
    "reply": "这是模型生成的回复文本",
    "sessionId": "sess_456",
    "actions": [ /* 结构化指令/建议 */ ],
    "metadata": { /* 任意元数据 */ }
  }

- 前端包装后的返回（`request` 函数）形如：
  { "success": true, "data": <上面业务对象> }

- 错误：使用 4xx/5xx，并返回 `{ message: string }`。

- 注意事项：后端在需要调用地图/图片/语音等子服务时应在 `actions` 或 `metadata` 中以结构化格式返回，便于前端解析并触发相应功能。

#### CHAT_HISTORY
- 路径：`GET /api/chat/history/:sessionId`
- 请求：无 body，sessionId 放在路径中。
- 成功响应示例：
  {
    "sessionId": "sess_456",
    "messages": [
      { "id": "m1", "from": "user", "text": "你好", "time": "..." },
      { "id": "m2", "from": "bot", "text": "你好，我能帮你什么？", "time": "..." }
    ]
  }

- 前端包装后返回为 `{ success: true, data }`。

#### CHAT_SESSION (删除会话)
- 路径：`DELETE /api/chat/session/:sessionId`
- 成功响应：`{ "ok": true }` 或 `{ "deleted": true }`（后端与前端约定即可）

---

### 2) 语音 API

#### SPEECH_TO_TEXT
- 路径：`POST /api/voice/speech-to-text`
- Content-Type：`multipart/form-data`
- 表单字段（FormData）:
  - `audio`: 文件字段（客户端会上传 audio 文件，前端示例中 name 为 `audio`）
  - `language`: 可选，语言码，例如 `zh-CN` 或 `en-US`
  - `actionType`: 可选，表示语音触发的功能类型

- 成功响应示例：
  {
    "text": "识别出的文本内容",
    "language": "zh-CN",
    "duration": 3.5
  }

- 注意：如果使用 fetch + FormData（浏览器 / RN），不要显式设置 `Content-Type` header，runtime 会自动设置 boundary；如果服务器需要额外字段（token 等）请在 FormData 中添加或用 headers 传递。

#### TEXT_TO_SPEECH
- 路径：`POST /api/voice/text-to-speech`
- 请求体（JSON）:
  - text: string
  - voiceType: string — `male` / `female`（默认 `female`）
  - language: string — 语言码
  - speed: number — 0.5 - 2.0

- 成功响应示例（两种常见方案）：
  1) 返回音频文件 URL：
     { "audioUrl": "http://.../tts/123.wav" }
  2) 返回 base64 音频：
     { "audioBase64": "<base64 string>", "mime": "audio/wav" }

- 前端默认会把响应当作 JSON 解析。若后端直接返回二进制流，请与前端开发者沟通使用不同的端点或返回带 URL 的 JSON。

---

### 3) 图片 API

#### IMAGE_UPLOAD
- 路径：`POST /api/upload/image`
- Content-Type：`multipart/form-data`
- 表单字段：
  - `file`: 图片文件

- 成功响应示例：
  {
    "id": "img_123",
    "url": "http://.../uploads/img_123.jpg",
    "width": 1200,
    "height": 800
  }

- **React Native 特别注意事项**：
  1. FormData 中的文件字段必须使用以下格式：
     ```js
     formData.append('file', {
       uri: 'file:///path/to/image.jpg',  // 本地文件 URI
       type: 'image/jpeg',                 // MIME 类型
       name: 'photo.jpg'                   // 文件名
     });
     ```
  
  2. **不要手动设置** `Content-Type: multipart/form-data` header！
     - 让 fetch/XMLHttpRequest 自动设置（包含正确的 boundary）
     - 错误示例: `headers: { 'Content-Type': 'multipart/form-data' }` ❌
     - 正确示例: 不设置 Content-Type，或在检测到 FormData 时删除它 ✓

  3. 如果后端返回 HTTP 400:
     - 检查后端日志，查看接收到的请求体格式
     - 确认字段名是 `file` 而不是其他名称
     - 确认 FormData 没有被 JSON.stringify
     - 确认 Content-Type header 包含正确的 boundary

- 备注：前端 `ImageAPI.uploadImage` 在带进度回调时会使用原生 `XMLHttpRequest` 上传，并解析 `xhr.responseText` 为 JSON；因此后端成功时应返回能被 JSON.parse 的文本。

#### IMAGE_ANALYSIS
- 路径：`POST /api/vision/analyze`
- 请求体（JSON）:
  - imageUrl: string — 已上传图片的可访问 URL
  - analysisType: string — `ocr` / `landmark` / `object` 等（前端默认 `landmark`）

- 成功响应示例（根据 analysisType 不同）：
  - OCR:
    {
      "type": "ocr",
      "textLines": ["第一行", "第二行"],
      "raw": { /* 可选原始识别结构 */ }
    }
  - LANDMARK:
    {
      "type": "landmark",
      "landmarks": [ { "name": "天安门", "confidence": 0.92, "location": {"lat":...,"lng":...} } ]
    }
  - OBJECT:
    {
      "type": "object",
      "objects": [ { "label": "person", "confidence": 0.98, "bbox": [x,y,w,h] } ]
    }

- 备注：前端 `analyzeImage` 会向该端点发送 JSON，所以后端应接受 JSON 并返回 JSON。

---

### 4) 地图 API

#### MAP_ROUTE
- 路径：`POST /api/map/route`
- 请求体（JSON）:
  - start: { lat: number, lng: number, name?: string }
  - end: { lat: number, lng: number, name?: string }
  - mode: string — `walking` / `driving` / `transit`（默认 `walking`）

- 成功响应示例：
  {
    "mode": "walking",
    "distance": 1200,  // 米
    "duration": 900,   // 秒
    "polyline": "xxxx...", // 可选编码折线
    "steps": [ { "instruction": "向东前进100米", "distance": 100 }, ... ]
  }

- 注意：前端会直接把该对象作为 data 使用，用于展示路线及步骤。

#### MAP_LOCATION
- 路径：`GET /api/map/location?lat=<lat>&lng=<lng>`
- 响应示例：
  {
    "address": "北京市朝阳区...",
    "poi": { "id": "poi_1", "name": "某地点" },
    "components": { /* 国家/省/市/街道 */ }
  }

#### MAP_SEARCH
- 路径：`POST /api/map/search`
- 请求体（JSON）:
  - keyword: string
  - location: { lat, lng }
  - radius: number (米)
  - category?: string

- 成功响应示例：
  {
    "results": [
      { "id": "poi_1", "name": "餐厅A", "location": { "lat":..., "lng":... }, "distance": 200 }
    ]
  }

#### MAP_POI (详情)
- 路径：`GET /api/map/poi/:poiId`
- 成功响应示例：
  {
    "id": "poi_1",
    "name": "餐厅A",
    "address": "...",
    "phone": "010-xxxx",
    "photos": ["..."],
    "rating": 4.3
  }

---

## 错误处理与状态码建议
- 200 OK：业务成功，返回业务对象。
- 400 Bad Request：参数错误或缺失。返回 `{ "message": "原因描述" }`。
- 401 Unauthorized：认证失败。返回 `{ "message": "请登录" }`。
- 403 Forbidden：无权访问。
- 404 Not Found：资源不存在（如 sessionId/poiId 等）。
- 422 Unprocessable Entity：语义校验失败（例如坐标不合法）。
- 500 Internal Server Error：服务端异常，返回 `{ "message": "服务器错误" }`。

前端 `request` 会把非 2xx 当作错误并返回 `{ success: false, error }`，因此后端在返回错误时最好包含有用的 `message` 字段。

---

## 示例请求（前端风格）

JSON POST（fetch）示例：

```js
// 发送聊天请求（前端样例）
fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '你好', sessionId: 'sess_1' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

Multipart 文件上传（curl）示例：

```bash
curl -X POST 'http://localhost:8000/api/upload/image' \
  -F "file=@/path/to/photo.jpg"
```

FormData / fetch（React Native / 浏览器）示例：

```js
const form = new FormData();
form.append('file', { uri: localUri, name: 'photo.jpg', type: 'image/jpeg' });
// 不要手动设置 'Content-Type'，让 runtime 处理 boundary
fetch('http://localhost:8000/api/upload/image', {
  method: 'POST',
  body: form,
});
```

---

## 与后端对齐的建议与注意点
1. 统一错误响应结构，例如 `{ "message": string, "code"?: string }`，方便前端展示错误提示。
2. 对于文件上传（图片/音频）使用稳定的字段名：`file`（图片）、`audio`（语音）。如需额外字段（language / actionType / imageId）请在 FormData 中添加。
3. 若 TTS 返回二进制流，建议改为先返回可以访问的 `audioUrl`，或返回 base64（两者选其一）。否则前端需要特殊处理二进制流。
4. 对于图片分析结果，建议返回 `type` 字段与统一的 `results` 或 `raw` 字段，方便前端按 `analysisType` 解析。
5. 请后端文档化每个端点的字段约束（必填/可选、类型、示例），便于前端做本地校验。

---

## 联系人
- 前端：MapGPT 前端团队
- 推荐在接口变化时通过 pull request 或在本文件中更新变更记录（Changelog）。

---

## 变更记录
- 2025-10-31 — 初版（基于 `src/services/api.js`）。



<!-- End of file -->
