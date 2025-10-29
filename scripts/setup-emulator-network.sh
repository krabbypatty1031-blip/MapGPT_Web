#!/bin/bash

# Android 模拟器网络配置脚本
# 用于配置模拟器使其能访问 Google 服务同时保持 Expo 连接

ADB="$HOME/Android/Sdk/platform-tools/adb"

echo "🔧 配置 Android 模拟器网络..."

# 1. 清除全局代理（避免影响 Expo）
echo "📍 清除全局代理..."
$ADB shell settings put global http_proxy :0

# 2. 配置 DNS（使用公共 DNS）
echo "📍 配置 DNS..."
$ADB shell settings put global private_dns_mode hostname
$ADB shell settings put global private_dns_specifier dns.alidns.com

# 3. 重启网络
echo "📍 重启网络服务..."
$ADB shell svc wifi disable
sleep 2
$ADB shell svc wifi enable
sleep 3

# 4. 测试网络连接
echo "📍 测试网络连接..."
echo "  - 测试基础网络 (baidu.com):"
$ADB shell ping -c 2 www.baidu.com | grep "bytes from"

echo "  - 测试 Google DNS (8.8.8.8):"
$ADB shell ping -c 2 8.8.8.8 | grep "bytes from"

echo ""
echo "✅ 网络配置完成！"
echo ""
echo "💡 提示："
echo "   - Expo 开发服务器应该可以正常连接"
echo "   - 如需访问 Google 服务，可能需要其他方案"
echo "   - 当前使用阿里云 DNS (dns.alidns.com)"
