#!/bin/bash

# 设置 Android SDK 环境变量
export ANDROID_HOME=C:\Users\KrabbyPatty\AppData\Local\Android\Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

echo "🔨 清理并重新构建 Android 开发版 APK..."
echo "⚠️  只在修改了原生代码或添加了原生依赖时才需要运行此脚本！"
echo ""

# 清理旧的构建
cd android
./gradlew clean
cd ..

# 重新构建并安装
echo ""
echo "📦 开始构建..."
npx expo run:android

echo ""
echo "✅ 构建完成！之后修改 JS 代码只需要运行 ./test.sh 即可。"
