#!/bin/bash

# ============================================
#  NIHONGO FIGHTER — 一鍵上線到 Railway 🚀
# ============================================

# 讓 Terminal 視窗保持在最前面
osascript -e 'tell application "Terminal" to activate' 2>/dev/null

# 顯示標題
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NIHONGO FIGHTER — 上線到 Railway   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 進入專案目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "📁 專案目錄：$SCRIPT_DIR"
echo ""

# ── 步驟 1：安裝 Railway CLI ──────────────────
echo "【步驟 1/5】安裝 Railway CLI..."
if command -v railway &>/dev/null; then
  echo "✅ Railway CLI 已安裝 ($(railway --version))"
else
  echo "   正在安裝..."
  npm install -g @railway/cli
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 安裝失敗。請先確認 npm 已安裝："
    echo "   https://nodejs.org"
    echo ""
    read -p "按 Enter 關閉視窗..."
    exit 1
  fi
  echo "✅ Railway CLI 安裝完成"
fi
echo ""

# ── 步驟 2：登入 Railway ──────────────────────
echo "【步驟 2/5】登入 Railway..."
echo "   👉 瀏覽器會自動開啟，請點選「Authorize」即可"
echo ""
railway login
if [ $? -ne 0 ]; then
  echo "❌ 登入失敗，請重試"
  read -p "按 Enter 關閉視窗..."
  exit 1
fi
echo "✅ 登入成功"
echo ""

# ── 步驟 3：建立 Railway 專案 ─────────────────
echo "【步驟 3/5】建立 Railway 專案..."

# 檢查是否已有 railway 專案連結
if [ -f ".railway" ] || railway status &>/dev/null 2>&1; then
  echo "✅ 已有既有專案，跳過此步驟"
else
  echo "   輸入專案名稱（直接按 Enter 使用預設：nihongo-fighter）："
  railway init --name nihongo-fighter 2>/dev/null || railway init
  if [ $? -ne 0 ]; then
    echo "❌ 建立專案失敗"
    read -p "按 Enter 關閉視窗..."
    exit 1
  fi
  echo "✅ 專案建立完成"
fi
echo ""

# ── 步驟 4：設定環境變數 ───────────────────────
echo "【步驟 4/5】設定環境變數..."

# 讀取現有的 .env 檔案（如果有）
if [ -f ".env" ]; then
  echo "   發現 .env 檔案，正在設定..."
  # 讀取並設定每個非空的環境變數
  while IFS='=' read -r key value; do
    # 跳過空行和注釋
    [[ -z "$key" || "$key" == \#* ]] && continue
    # 跳過佔位符值
    [[ "$value" == *"MY_"* || -z "$value" ]] && continue
    # 移除引號
    value="${value%\"}"
    value="${value#\"}"
    echo "   設定 $key"
    railway variables set "$key=$value" 2>/dev/null
  done < .env
  echo "✅ 環境變數設定完成"
else
  echo "   ℹ️  未找到 .env 檔案，跳過（Notion 功能將使用備用資料）"
fi
# 設定 NODE_ENV
railway variables set NODE_ENV=production 2>/dev/null
echo ""

# ── 步驟 5：部署上線 ──────────────────────────
echo "【步驟 5/5】部署中，請稍候... ⏳"
echo "   （通常需要 2-4 分鐘）"
echo ""
railway up --detach
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ 部署失敗，查看錯誤日誌："
  railway logs
  read -p "按 Enter 關閉視窗..."
  exit 1
fi
echo ""

# ── 取得網址 ──────────────────────────────────
echo "✨ 正在生成公開網址..."
railway domain 2>/dev/null || echo "   （網址生成中，請稍等 Railway 完成部署）"
echo ""
echo "╔══════════════════════════════════════╗"
echo "║        🎉 部署完成！恭喜上線！       ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "📌 查看部署狀態：railway status"
echo "📋 查看日誌：    railway logs"
echo "🔄 更新版本：    railway up"
echo ""
echo "提示：首次部署可能需要 3-5 分鐘讓 Railway 建置完成"
echo ""

# 開啟 Railway 儀表板
echo "正在開啟 Railway 儀表板..."
railway open 2>/dev/null

read -p "按 Enter 關閉視窗..."
