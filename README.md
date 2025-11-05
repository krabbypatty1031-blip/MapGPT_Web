# MapGPT Frontend (mapgpt_front)

地图助手移动应用 — 基于 Expo / React Native 的混合项目（含 Android 原生工程）。本 README 包含本地安装、编译与启动说明，以及当前项目结构说明。

## 目录

- 安装、编译与启动
- 项目结构
- 本地打包（生成 APK）
- 常见问题与排查

---

## 1. 安装、编译与启动

先决条件（建议）：

- Node.js >= 18
- npm >= 9
- Java JDK 11+（用于 Android 构建）
- Android Studio（包含 SDK 与模拟器）
- Expo CLI（可选，使用 npx 也可）

推荐的快速步骤：

1. 克隆仓库并进入项目目录

```bash
git clone <repository-url>
cd mapgpt_front
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器（Android）

修改scripts/build.sh 和 test.sh 内的 Android SDK 变量

第一次构建/更改原生代码或添加了原生依赖时
```bash
scripts/build.sh
```

一般修改（热加载）
```bash
scripts/test.sh
```

---

## 2. 项目结构（基于仓库当前内容）

顶层文件与目录说明：

- `App.js` — 应用入口
- `index.js` — 入口挂载文件
- `package.json` — npm 脚本与依赖
- `babel.config.js` — Babel 配置（使用 `babel-preset-expo`）
- `android/` — Android 原生工程（可用 Gradle 直接打包）
- `ios/` — iOS 原生工程（若存在）
- `src/` — 源代码
  - `components/` — 可复用 UI 组件（如 Chat、Map、Message 列表等）
  - `screens/` — 页面组件（`WelcomeScreen.js`, `AssistantScreen.js` 等）
  - `hooks/` — 自定义 hooks（`useChat.js`, `useMap.js` 等）
  - `services/` — 各类服务封装（`chatService.js`, `imageService.js`, `mapService.js` 等）
  - `utils/` — 工具函数
  - `constants/` — 常量与初始数据

示例树（简化）：

```
/
├── App.js
├── package.json
├── babel.config.js
├── android/
├── src/
│   ├── components/
│   ├── screens/
│   ├── hooks/
│   ├── services/
│   └── utils/
└── README.md
```

---

## 3. 本地打包（生成 APK）
用 Gradle 在本机构建 APK

1. 进入 Android 目录：

```bash
cd android
./gradlew assembleRelease
```

2. 构建完成后，APK 位于：

- `android/app/build/outputs/apk/release/app-release.apk`

注意：

- 若未配置签名（signingConfigs），生成的 release APK 可能是未签名的。你需要在 `android/app/build.gradle` 中配置签名或在 `gradle.properties` 中提供签名凭据。
- 如果你更希望一个已签名并上传到 Play Store 的 artifact，建议使用 EAS Build（`eas build -p android --profile production`）。

---
