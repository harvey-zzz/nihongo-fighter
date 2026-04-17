#!/bin/bash
cd "$(dirname "$0")"

echo "=============================="
echo "  NIHONGO FIGHTER 啟動中..."
echo "=============================="
echo ""

# 安裝依賴（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
  echo "🔧 首次啟動，安裝套件中（約1分鐘）..."
  npm install
fi

echo "🚀 伺服器啟動中，請稍候..."
echo ""

# 等待伺服器啟動後自動開啟瀏覽器
(sleep 3 && open "http://localhost:5173") &

npm run dev
