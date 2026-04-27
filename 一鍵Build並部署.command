#!/bin/bash
# NIHONGO FIGHTER — 一鍵清理 + Build + 部署到 Railway
# 雙擊此檔案即可自動完成所有步驟

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  NIHONGO FIGHTER — 一鍵清理＋部署     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ── 步驟 1：清除殘留 lock 檔 ─────────────────
echo "【1/6】清除舊的 git lock 檔..."
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock 2>/dev/null
echo "✅ 完成"
echo ""

# ── 步驟 2：刪除不必要的舊檔案 ──────────────
echo "【2/6】刪除不必要的舊檔案..."

if [ -f "server.ts" ]; then
  rm -f server.ts
  echo "   🗑️  server.ts（舊後端，已改純前端）"
fi

if [ -f "src/lib/analytics.js" ]; then
  rm -f src/lib/analytics.js
  echo "   🗑️  src/lib/analytics.js（未使用）"
fi

if [ -f "tests/server-port.test.mjs" ]; then
  rm -f tests/server-port.test.mjs
  echo "   🗑️  tests/server-port.test.mjs（測試舊 server）"
fi

if [ -f "上線步驟.md" ]; then
  rm -f 上線步驟.md
  echo "   🗑️  上線步驟.md（已過時）"
fi

echo "✅ 清理完成"
echo ""

# ── 步驟 3：確認 node_modules ────────────────
echo "【3/6】確認依賴套件..."
if [ ! -d "node_modules" ]; then
  echo "   正在安裝依賴（首次需幾分鐘）..."
  npm install
fi
echo "✅ 完成"
echo ""

# ── 步驟 4：Build 最新版本 ──────────────────
echo "【4/6】Build 最新程式碼..."
npm run build
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build 失敗！請截圖錯誤訊息回報。"
  read -p "按 Enter 關閉..."
  exit 1
fi
echo "✅ Build 成功！"
echo ""

# ── 步驟 5：Commit ───────────────────────────
echo "【5/6】Commit 全部更新..."
git add -A
git commit -m "清理舊檔 + 部署更新：pre-built dist + 手機版改動

移除：server.ts / analytics.js / server-port 測試
包含：手機版三格HP、目標卡、送出按鈕、振り仮名修正

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
if [ $? -ne 0 ]; then
  echo "ℹ️  沒有新變更需要 commit，繼續推送..."
fi
echo "✅ 完成"
echo ""

# ── 步驟 6：推送 + Railway 部署 ──────────────
echo "【6/6】推送到 GitHub + 觸發 Railway 部署..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ 推送失敗，請檢查網路連線"
  read -p "按 Enter 關閉..."
  exit 1
fi
echo "✅ 推送成功！"

if command -v railway &>/dev/null; then
  echo "正在觸發 Railway 重新部署..."
  railway up --detach 2>/dev/null
  echo "✅ Railway 部署中"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  🎉 全部完成！約 2-3 分鐘後可測試     ║"
echo "║  https://lavish-gratitude-production-  ║"
echo "║  74e9.up.railway.app/                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
read -p "按 Enter 關閉視窗..."
