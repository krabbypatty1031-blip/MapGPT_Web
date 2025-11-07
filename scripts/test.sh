#!/bin/bash

# 设置 Android SDK 环境变量
export ANDROID_HOME=C:\Users\KrabbyPatty\AppData\Local\Android\Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 启动 Metro bundler（支持热更新）
echo "🚀 启动 Metro bundler..."
echo "📱 请在手机上打开 MapGPT 开发版 App"
echo "💡 修改代码后会自动热更新，无需重新构建 APK！"
echo ""
npx expo start --offline