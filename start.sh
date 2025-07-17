#!/bin/bash

# Smart Screen 開発サーバー起動スクリプト
DEBUG_MODE=false
FORCE_HTTP=false

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --debug)
      DEBUG_MODE=true
      shift
      ;;
    --http)
      FORCE_HTTP=true
      shift
      ;;
    *)
      echo "不明なオプション: $1"
      echo "使用方法: $0 [--debug] [--http]"
      echo "  --debug  : デバッグモードで起動"
      echo "  --http   : HTTPモードを強制（PWA無効）"
      exit 1
      ;;
  esac
done

echo "🚀 Smart Screen 開発サーバーを起動しています..."

if [ "$DEBUG_MODE" = true ]; then
  echo "🐛 デバッグモードで起動中..."
  export VITE_DEBUG_MODE=true
fi

# SSL証明書自動作成（--httpが指定されていない場合）
if [ "$FORCE_HTTP" != true ]; then
  if [ ! -f "frontend/server.key" ] || [ ! -f "frontend/server.crt" ]; then
    echo "🔒 PWA機能のためSSL証明書を作成中..."
    openssl req -x509 -newkey rsa:2048 -keyout frontend/server.key -out frontend/server.crt -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=SmartScreen/CN=localhost" > /dev/null 2>&1
    echo "✅ SSL証明書を作成しました"
  fi
  echo "🔒 PWAモード（HTTPS）で起動中..."
else
  echo "📡 HTTPモードで起動中..."
fi

# バックエンドサーバーを起動
echo "📡 バックエンドサーバーを起動中..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# フロントエンドサーバーを起動
echo "🎨 フロントエンドサーバーを起動中..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "✅ 起動完了！"

# バックエンドのプロトコル確認
if [ "$FORCE_HTTP" != true ] && [ -f "backend/server.key" ] && [ -f "backend/server.crt" ]; then
  echo "- バックエンド: https://localhost:3001"
else
  echo "- バックエンド: http://localhost:3001"
fi

# SSL証明書が存在するかチェック
if [ "$FORCE_HTTP" != true ] && [ -f "frontend/server.key" ] && [ -f "frontend/server.crt" ]; then
  echo "- フロントエンド: https://localhost:5173"
  echo ""
  echo "📱 PWA機能が有効です："
  echo "  • Service Worker: 有効"
  echo "  • オフライン対応: 有効"
  echo "  • インストール可能: 有効"
  echo "  • 全画面表示: 対応"
  echo ""
  echo "🔧 Android全画面表示方法："
  echo "  1. Chromeでhttps://localhost:5173を開く"
  echo "  2. 右上メニュー > 「ホーム画面に追加」"
  echo "  3. アプリとしてインストール"
  echo "  4. または Fully Kiosk Browser を使用"
else
  echo "- フロントエンド: http://localhost:5173"
  echo ""
  echo "📄 HTTPモードで動作中（PWA機能制限あり）"
  echo "💡 完全なPWA機能を使用するには通常起動してください"
  echo "   例: ./start.sh"
fi
echo ""
echo "停止するには Ctrl+C を押してください"

# 終了処理
cleanup() {
    echo "🛑 サーバーを停止しています..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# プロセスが生きている間待機
wait