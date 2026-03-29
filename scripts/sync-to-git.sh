#!/bin/bash

# OPC Mark 自动同步脚本
# 用法：./sync-to-git.sh

set -e

echo "🚀 开始同步到 Git 仓库..."

# 1. 检查 Git 状态
echo "📊 检查 Git 状态..."
git status

# 2. 添加所有变更
echo "📦 添加所有变更..."
git add -A

# 3. 提交变更
echo "💾 提交变更..."
read -p "输入提交信息 (默认：自动同步更新): " commit_msg
commit_msg=${commit_msg:-"自动同步更新 $(date +%Y-%m-%d_%H:%M)"}
git commit -m "$commit_msg"

# 4. 推送到远程
echo "☁️ 推送到远程仓库..."
git push origin main

# 5. 部署到 Vercel
echo "🔷 部署到 Vercel..."
read -p "是否部署到 Vercel Production? (y/n, 默认：n): " deploy
if [[ $deploy == "y" ]]; then
    vercel --prod
fi

echo "✅ 同步完成！"
echo ""
echo "📋 下次只需运行：./sync-to-git.sh"
