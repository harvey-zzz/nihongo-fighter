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
for f in server.ts src/lib/analytics.js tests/server-port.test.mjs 上線步驟.md; do
  [ -f "$f" ] && rm -f "$f" && echo "   🗑️  $f"
done
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
git commit -m "部署更新 $(date '+%Y-%m-%d %H:%M')

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
if [ $? -ne 0 ]; then
  echo "ℹ️  沒有新變更需要 commit，繼續推送..."
fi
echo "✅ 完成"
echo ""

# ── 步驟 6：推送到 GitHub ─────────────────────
echo "【6/6】推送到 GitHub..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ 推送失敗，請檢查網路連線"
  read -p "按 Enter 關閉..."
  exit 1
fi
echo "✅ 推送成功！"
echo ""

# ── Railway 部署（三種方式自動嘗試）──────────
echo "── Railway 部署 ──"

# 方式一：Railway CLI（最快）
if command -v railway &>/dev/null; then
  echo "✅ Railway CLI 已安裝，正在部署..."
  railway up --detach
  if [ $? -eq 0 ]; then
    echo "✅ Railway 部署觸發成功！"
  else
    echo "⚠️  railway up 失敗，請確認 railway login 已完成"
    echo "   手動指令：railway login 然後 railway up"
  fi
else
  echo "ℹ️  Railway CLI 未安裝"
  echo "   已推送到 GitHub，GitHub Actions 會自動觸發部署"
  echo ""
  echo "   如果 GitHub Actions 沒有設定，請手動操作："
  echo "   1. 開啟 https://railway.app/dashboard"
  echo "   2. 找到 nihongo-fighter 專案"
  echo "   3. 點 Deploy → 選 Redeploy"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  完成！約 2-3 分鐘後可測試            ║"
echo "║  https://lavish-gratitude-production-  ║"
echo "║  74e9.up.railway.app/                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
read -p "按 Enter 關閉視窗..."
