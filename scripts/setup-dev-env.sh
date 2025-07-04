#!/bin/bash

# Smart Display - 開発環境セットアップスクリプト
# 並列開発用の環境を準備

echo "⚙️  Smart Display - 開発環境セットアップ"
echo "======================================="

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 依存関係のインストール
echo "📦 依存関係のインストール中..."

echo "  バックエンド依存関係..."
if [ -d "backend" ]; then
    cd backend
    npm install
    cd ..
    echo "  ✅ バックエンド完了"
else
    echo "  ❌ backendディレクトリが見つかりません"
fi

echo "  フロントエンド依存関係..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
    echo "  ✅ フロントエンド完了"
else
    echo "  ❌ frontendディレクトリが見つかりません"
fi

# 環境変数ファイルの作成
echo ""
echo "🔧 環境変数ファイルの設定..."

# バックエンド環境変数
if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    echo "  ✅ backend/.env を作成しました"
    echo "  ⚠️  OpenWeatherMap API キーを設定してください"
else
    echo "  ℹ️  backend/.env は既に存在します"
fi

# フロントエンド環境変数
if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
    cp frontend/.env.example frontend/.env
    echo "  ✅ frontend/.env を作成しました"
else
    echo "  ℹ️  frontend/.env は既に存在します"
fi

# 開発サーバー起動スクリプトの作成
echo ""
echo "🚀 開発サーバー起動スクリプトを作成..."

cat > scripts/start-servers.sh << 'EOF'
#!/bin/bash

# 開発サーバー並列起動

echo "🚀 Smart Display 開発サーバー起動"
echo "==============================="

# バックエンドサーバー起動 (バックグラウンド)
echo "バックエンドサーバー起動中..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 少し待ってからフロントエンドサーバー起動
sleep 3
echo "フロントエンドサーバー起動中..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ サーバー起動完了"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "アクセス先:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "停止するには Ctrl+C を押してください"

# シグナルハンドラー設定
trap 'echo ""; echo "🛑 サーバーを停止しています..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# サーバーが動いている間は待機
wait
EOF

chmod +x scripts/start-servers.sh

# VS Code設定ファイルの作成
echo ""
echo "🔧 VS Code設定を作成..."

mkdir -p .vscode

cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.workingDirectories": ["frontend", "backend"],
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
EOF

cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "cwd": "${workspaceFolder}/backend"
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
EOF

# 推奨拡張機能リスト
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
EOF

echo "  ✅ VS Code設定完了"

# セットアップ完了
echo ""
echo "🎉 開発環境セットアップ完了！"
echo ""
echo "📋 次の手順:"
echo "  1. backend/.env でOpenWeatherMap APIキーを設定"
echo "  2. 並列開発を開始: ./scripts/start-parallel-dev.sh"
echo "  3. 開発サーバー起動: ./scripts/start-servers.sh"
echo ""
echo "💡 便利なコマンド:"
echo "  ./scripts/branch-manager.sh status  - ブランチ状態確認"
echo "  ./scripts/branch-manager.sh clean   - マージ済みブランチ削除"
echo ""