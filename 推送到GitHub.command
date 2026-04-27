#!/bin/bash
cd "$(dirname "$0")"
echo "📤 推送程式碼到 GitHub..."
git push -u origin main
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 成功！程式碼已上傳到 GitHub"
  echo "   https://github.com/harvey-zzz/nihongo-fighter"
else
  echo "❌ 推送失敗"
fi
read -p "按 Enter 關閉..."
