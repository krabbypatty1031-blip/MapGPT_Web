# MapGPT 快速启动指南

## 🚀 第一次使用

### 1. 安装依赖

```bash
cd mapgpt_optimized
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：
- Google Maps API Key
- 后端 API 地址

### 3. 启动应用

```bash
npm start
```

## 📱 在不同平台运行

### Android (推荐)

**方法 1: 使用 Expo Go (最简单)**
1. 在手机上安装 Expo Go 应用
2. 运行 `npm start`
3. 用手机扫描终端中的二维码

**方法 2: Android 模拟器**
1. 确保 Android Studio 已安装
2. 设置 ANDROID_HOME 环境变量：
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```
3. 运行：
   ```bash
   npm run android
   ```

**方法 3: 真机调试**
1. 启用手机的开发者选项和 USB 调试
2. 用 USB 连接手机到电脑
3. 运行 `npm run android`

### iOS (仅 macOS)

```bash
npm run ios
```

### Web

```bash
npm run web
```

注意：react-native-maps 在 web 端不可用，地图功能仅在移动端可用。

## 🔧 常见问题

### 1. 端口占用

如果 8081 端口被占用，使用其他端口：
```bash
npx expo start --port 8082
```

### 2. Android SDK 未找到

设置环境变量：
```bash
# 在 ~/.zshrc 或 ~/.bashrc 中添加
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

然后重新加载配置：
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

### 3. 依赖版本冲突

清除缓存并重新安装：
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### 4. Metro bundler 错误

清除 Metro 缓存：
```bash
npx expo start --clear
```

## 📦 构建发布版本

### Android APK

```bash
eas build --platform android
```

### iOS IPA

```bash
eas build --platform ios
```

需要先配置 EAS (Expo Application Services)：
```bash
npm install -g eas-cli
eas login
eas build:configure
```

## 🛠️ 开发工具

### VSCode 推荐插件

- ESLint
- Prettier
- React Native Tools
- JavaScript and TypeScript Nightly

### 调试

1. **React Native Debugger**
   - 下载并安装 React Native Debugger
   - 在应用中按 `Ctrl+M` (Android) 或 `Cmd+D` (iOS)
   - 选择 "Debug"

2. **Chrome DevTools**
   - 在开发者菜单中选择 "Debug with Chrome"
   - 打开 Chrome 访问 `chrome://inspect`

## 📝 提交代码

提交前确保：
```bash
# 格式化代码
npm run format

# 检查代码
npm run lint
```

## 🔄 更新依赖

检查过期的包：
```bash
npm outdated
```

更新所有依赖：
```bash
npm update
```

更新特定包：
```bash
npm install package-name@latest
```

## 📞 获取帮助

- 查看完整文档：README.md
- 报告问题：创建 GitHub Issue
- 技术支持：support@hkbu.edu.hk

---

祝你开发愉快！🎉
