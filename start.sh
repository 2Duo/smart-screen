#!/bin/bash

# Smart Screen 開発サーバー起動スクリプト
DEBUG_MODE=false

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --debug)
      DEBUG_MODE=true
      shift
      ;;
    *)
      echo "不明なオプション: $1"
      echo "使用方法: $0 [--debug]"
      exit 1
      ;;
  esac
done

echo "🚀 Smart Screen 開発サーバーを起動しています..."
if [ "$DEBUG_MODE" = true ]; then
  echo "🐛 デバッグモードで起動中..."
  export VITE_DEBUG_MODE=true
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
echo "- バックエンド: http://localhost:3001"
echo "- フロントエンド: http://localhost:5173"
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