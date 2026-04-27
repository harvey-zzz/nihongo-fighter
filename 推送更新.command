#!/bin/bash
cd "$(dirname "$0")"
echo "📤 推送最新修改到 GitHub..."
git push origin main
if [ $? -eq 0 ]; then
  echo "✅ 推送成功！Railway 會自動重新部署"
  echo "   網站：https://nihongo-fighter-production.up.railway.app"
else
  echo "❌ 推送失敗"
fi
read -p "按 Enter 關閉..."
