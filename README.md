# Smart Display System 📺

スマートディスプレイアプリケーション - 家庭やオフィスでの情報表示に最適な高性能Webアプリ

## 📋 概要

このプロジェクトは、ウィジェットベースのスマートディスプレイアプリケーションです。時計、天気、カレンダーなどのウィジェットをドラッグ&ドロップで自由に配置し、タブレットやPC画面をスマートディスプレイとして活用できます。

### 主な特徴
- 🎨 **美しいUI**: Liquid Glass エフェクトと Material Design 対応
- 📱 **レスポンシブ対応**: タブレット・PC・スマートフォンで最適表示
- ⚡ **高性能**: React + TypeScript によるモダンな実装
- 🔧 **高度なカスタマイズ**: 自由度の高い設定とレイアウト調整
- 🔒 **セキュア**: 本番環境対応のセキュリティ設計

## 🏃‍♂️ クイックスタート

### 📋 必要な環境
- **Node.js**: 18.0 以上
- **npm**: 9.0 以上（Node.jsと一緒にインストールされます）
- **ブラウザ**: Chrome, Safari, Firefox, Edge の最新版

### 🚀 初回セットアップ（10分で完了）

#### 1. プロジェクトの準備
```bash
# リポジトリをクローン（またはダウンロード）
git clone <repository-url>
cd smart-screen

# または、ダウンロードしたZIPファイルを解凍して
cd smart-screen
```

#### 2. 依存関係のインストール
```bash
# バックエンドの準備
cd backend
npm install

# フロントエンドの準備
cd ../frontend
npm install
```

#### 3. 天気機能の設定（必須）
天気ウィジェットを使用するには、無料のOpenWeatherMap APIキーが必要です：

1. **APIキーの取得**:
   - [OpenWeatherMap](https://openweathermap.org/) にアクセス
   - 「Sign Up」でアカウントを作成（無料）
   - ダッシュボードの「API Keys」からキーをコピー

2. **環境変数の設定**:
```bash
# backend フォルダで実行
cd backend
echo "OPENWEATHER_API_KEY=YOUR_API_KEY_HERE" > .env
echo "NODE_ENV=production" >> .env
echo "PORT=3001" >> .env
```

#### 4. アプリケーションの起動

##### 🎯 簡単起動（推奨）
```bash
# プロジェクトルートで実行
./start.sh
```

##### 🔧 手動起動
```bash
# ターミナル1: バックエンドサーバー
cd backend
npm run dev

# ターミナル2: フロントエンドサーバー
cd frontend
npm run dev
```

#### 5. ブラウザでアクセス
- **開発版**: http://localhost:5173
- **デバッグモード**: http://localhost:5173?test=true

## 🎮 基本的な使い方

### 初期設定
1. **編集モードの開始**: 
   - 画面右上隅で長押し（タッチ）、または
   - 画面右端から左へスワイプ、または
   - キーボードの「M」キーを押す

2. **ウィジェットの追加**: 
   - ➕ ボタンから追加したいウィジェットを選択

3. **レイアウト調整**: 
   - ウィジェットをドラッグして移動
   - 角をドラッグしてサイズ変更

4. **設定のカスタマイズ**: 
   - ⚙️ ボタンで全体設定
   - 各ウィジェットの設定ボタンで個別設定

### ウィジェット設定例

#### 🌤️ 天気ウィジェット
- **地域設定**: 「東京」「Osaka」「New York」など
- **表示項目**: 気温、湿度、降水確率など
- **レイアウト**: コンパクト/詳細表示の切り替え

#### 📅 カレンダーウィジェット
- **Google連携**: OAuth認証で予定を同期
- **表示期間**: 今日/明日/週間表示
- **フォント設定**: サイズと色のカスタマイズ

#### 🕐 時計ウィジェット
- **フォーマット**: 12時間/24時間制
- **表示要素**: 秒針、日付、曜日の表示/非表示
- **カラー**: 文字色と背景の調整

## 🚀 本番環境での運用

本番環境（実際のタブレットやディスプレイ）で運用する場合の手順です。

### 🎯 方法1: 開発サーバーでの運用（推奨・簡単）

最も簡単で安定した方法です。ほとんどの用途に十分です。

```bash
# 1. APIキーを本番用に設定
cd backend
echo "OPENWEATHER_API_KEY=YOUR_API_KEY_HERE" > .env
echo "NODE_ENV=production" >> .env

# 2. サーバーを起動（常時稼働）
./start.sh

# 3. ブラウザでアクセス
# http://localhost:5173 をブックマークしてフルスクリーン表示
```

**💡 この方法のメリット：**
- セットアップが簡単
- 設定変更が即座に反映
- トラブル時の対応が容易
- デバッグ機能が使える

### 🏭 方法2: 本番ビルドでの運用（高パフォーマンス）

より高いパフォーマンスが必要な場合や、複数台での運用時に推奨。

#### ステップ1: ビルドの作成
```bash
# フロントエンドの本番ビルド（5分程度）
cd frontend
npm run build
# ✅ dist フォルダに最適化されたファイルが作成される

# バックエンドのビルド（1分程度）
cd ../backend
npm run build
# ✅ dist フォルダにサーバーファイルが作成される
```

#### ステップ2: 本番サーバーの起動

##### A. 簡単な方法（Node.jsのみ）
```bash
# バックエンドサーバーを起動
cd backend
npm start

# ブラウザで http://localhost:3001/static にアクセス
# または frontend/dist/index.html をブラウザで直接開く
```

##### B. 本格的な方法（Nginx使用 - Linux/Mac）
```bash
# 1. Nginxをインストール
# Ubuntu: sudo apt install nginx
# Mac: brew install nginx

# 2. 設定ファイルを作成
sudo tee /etc/nginx/sites-available/smartdisplay <<EOF
server {
    listen 80;
    server_name localhost;
    
    # フロントエンド（静的ファイル）
    location / {
        root /path/to/smart-screen/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # バックエンドAPI
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# 3. 設定を有効化
sudo ln -s /etc/nginx/sites-available/smartdisplay /etc/nginx/sites-enabled/
sudo systemctl reload nginx

# 4. バックエンドサーバーを起動
cd backend && npm start

# 5. ブラウザで http://localhost にアクセス
```

### 🖥️ タブレット・ディスプレイでの表示設定

#### フルスクリーン表示の設定
```javascript
// ブラウザのコンソール（F12）で実行
document.documentElement.requestFullscreen()

// 自動でフルスクリーンにする場合（ブックマークレット）
javascript:document.documentElement.requestFullscreen()
```

#### ブラウザ設定（Chrome推奨）
1. **キオスクモード**: `chrome --kiosk http://localhost:5173`
2. **自動起動**: スタートアップにブラウザを追加
3. **スリープ防止**: 電源設定で「スリープしない」に設定

#### タブレット設定
1. **画面の向き**: 横向き固定
2. **自動ロック**: オフ
3. **通知**: オフ
4. **ホームボタン**: 無効化（Android）

### 🔄 自動起動の設定

#### Windows
```batch
@echo off
cd /d "C:\path\to\smart-screen"
start cmd /k "cd backend && npm start"
timeout /t 5
start chrome --kiosk http://localhost:5173
```

#### Mac
```bash
#!/bin/bash
cd ~/smart-screen
osascript -e 'tell app "Terminal" to do script "cd ~/smart-screen && ./start.sh"'
sleep 5
open -a "Google Chrome" --args --kiosk http://localhost:5173
```

#### Linux (systemd)
```ini
# /etc/systemd/system/smartdisplay.service
[Unit]
Description=Smart Display Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-screen
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

### 📱 リモートアクセス（同一LAN内）

他のデバイスからアクセスする場合：

```bash
# サーバーのIPアドレスを確認
ip addr show    # Linux
ifconfig        # Mac
ipconfig        # Windows

# 例：192.168.1.100 の場合
# http://192.168.1.100:5173 でアクセス可能
```

### 🛡️ セキュリティ設定（本番環境）

```bash
# 1. ファイアウォール設定（必要なポートのみ開放）
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 5173  # 開発サーバー（必要に応じて）
sudo ufw enable

# 2. 自動更新の無効化（表示の安定性のため）
# システム設定で自動更新をオフにする

# 3. 不要なサービスの停止
# ウイルススキャンなどの重いプロセスを停止
```

### 🔧 メンテナンス

#### 日常のメンテナンス
```bash
# ログの確認
tail -f backend/logs/app.log

# 再起動
./restart.sh

# 設定のバックアップ
cp -r ~/.smartdisplay-config ~/backup/
```

#### トラブル時の対応
```bash
# プロセスの確認
ps aux | grep node

# ポートの確認
netstat -tlnp | grep :3001

# 強制終了・再起動
pkill -f "npm.*start"
./start.sh
```

### 📊 パフォーマンス監視

```bash
# システムリソースの監視
htop          # CPU・メモリ使用率
iotop         # ディスクI/O
nethogs       # ネットワーク使用量

# アプリケーションの監視
curl http://localhost:3001/health  # ヘルスチェック
```

**💡 運用のコツ：**
- 最初は「方法1」から始めて、慣れてから「方法2」に移行
- 24時間運用の場合は再起動スケジュールを設定（週1回など）
- 設定変更前は必ずバックアップを取る
- ネットワーク環境の変更時はIPアドレスを確認

## 🛠️ 開発者向け情報

### 技術スタック
- **フロントエンド**: React 18, TypeScript, Vite, Tailwind CSS
- **バックエンド**: Node.js, Express, TypeScript, Socket.io
- **状態管理**: Zustand
- **データ取得**: React Query
- **レイアウト**: React Grid Layout

### 開発コマンド
```bash
# 型チェック
npm run typecheck

# コードの品質チェック
npm run lint

# 開発サーバー（ホットリロード付き）
npm run dev

# 本番ビルドのテスト
npm run build
```

### プロジェクト構造
```
smart-screen/
├── frontend/           # React TypeScript アプリ
│   ├── src/
│   │   ├── components/ # UIコンポーネント
│   │   ├── stores/     # 状態管理（Zustand）
│   │   ├── utils/      # ユーティリティ関数
│   │   └── styles/     # スタイル定義
│   └── dist/          # ビルド成果物
├── backend/           # Express TypeScript サーバー
│   ├── src/
│   │   ├── config/    # 設定管理
│   │   └── utils/     # バリデーション等
│   └── dist/         # ビルド成果物
├── shared/           # 共通型定義
└── docs/            # ドキュメント
```

## 🔒 セキュリティ

このアプリケーションは本番環境での使用を考慮したセキュリティ設計です：

- **入力値検証**: すべてのAPI入力の厳密な検証
- **XSS対策**: HTMLエスケープとCSP実装
- **レート制限**: API呼び出し制限
- **環境変数管理**: 機密情報の適切な管理

## 🐛 トラブルシューティング

### 🚨 緊急時の対応

#### アプリが起動しない
```bash
# 1. まずはこれを試す
cd smart-screen
./start.sh

# 2. それでもダメな場合
cd backend
rm -rf node_modules
npm install
cd ../frontend  
rm -rf node_modules
npm install
cd ..
./start.sh
```

#### 画面が真っ白になる
```bash
# 📱 ブラウザで F12 を押してConsoleタブを開く
# ❌ エラーメッセージをメモする

# 🔄 データをリセット
localStorage.clear()
location.reload()

# 🆕 それでもダメなら新しいタブで開く
# http://localhost:5173?test=true
```

### ⚠️ よくある問題と解決法

#### 1. 天気が「読み込み中...」のまま
**原因**: APIキーが設定されていない

**解決法**:
```bash
# APIキーの確認
cd backend
cat .env

# 何も表示されない場合はAPIキーを設定
echo "OPENWEATHER_API_KEY=あなたのAPIキー" > .env
echo "NODE_ENV=production" >> .env

# サーバーを再起動
cd ..
./start.sh
```

#### 2. ウィジェットが追加できない
**原因**: 編集モードになっていない

**解決法**:
1. 画面右上隅を長押し（3秒）
2. または画面右端から左へスワイプ
3. または キーボードの「M」キーを押す
4. ボタンが表示されたら ➕ をクリック

#### 3. 「ポートが使用中」エラー
**原因**: 他のアプリがポートを使用している

**解決法**:
```bash
# 使用中のプロセスを確認
lsof -i :3001
lsof -i :5173

# プロセスを終了（PIDを確認して実行）
kill -9 [PID番号]

# または全部終了
pkill -f node
pkill -f npm

# 再起動
./start.sh
```

#### 4. カレンダーが表示されない
**原因**: Google認証が完了していない

**解決法**:
1. カレンダーウィジェットの設定ボタンをクリック
2. 「認証」タブを選択
3. 「Googleでログイン」をクリック
4. ブラウザでGoogleアカウントにログイン
5. 許可を与える

#### 5. レイアウトが保存されない
**原因**: ブラウザのプライベートモードまたはストレージ制限

**解決法**:
```bash
# ブラウザの設定を確認
# - プライベート/シークレットモードを解除
# - Cookieとサイトデータを許可

# 手動でデータを確認
# F12 > Application > Local Storage > localhost:5173
```

### 🔍 詳細なログ確認

#### サーバーログの見方
```bash
cd backend
npm run dev

# 以下のようなログが正常
# ✅ Smart Display Server running on http://localhost:3001
# ✅ Socket connected
# ❌ Error: Invalid API key (要修正)
# ❌ EADDRINUSE: Port 3001 already in use (要修正)
```

#### ブラウザログの見方
1. **F12** を押して開発者ツールを開く
2. **Console** タブをクリック
3. 正常な場合: `App initialized` などのメッセージ
4. エラーの場合: 赤いメッセージが表示される

### 🔄 完全リセット手順

すべてがうまくいかない場合の最終手段：

```bash
# 1. すべてのプロセスを終了
pkill -f node
pkill -f npm

# 2. ブラウザのデータをクリア
# Chrome: 設定 > プライバシー > 閲覧履歴を消去
# または F12 > Application > Clear storage

# 3. プロジェクトを再インストール
cd smart-screen
rm -rf frontend/node_modules backend/node_modules
rm -rf frontend/dist backend/dist

cd backend && npm install
cd ../frontend && npm install

# 4. 環境変数を再設定
cd ../backend
echo "OPENWEATHER_API_KEY=あなたのAPIキー" > .env
echo "NODE_ENV=production" >> .env

# 5. 再起動
cd ..
./start.sh
```

### 📞 サポートが必要な場合

#### 自己診断チェックリスト
- [ ] Node.js 18以上がインストールされている（`node --version`）
- [ ] npm が正常に動作する（`npm --version`）
- [ ] OpenWeatherMap APIキーが設定されている
- [ ] ポート3001と5173が空いている
- [ ] ブラウザが最新版である
- [ ] インターネット接続が正常である

#### エラーレポートの作成
問題を報告する際は、以下の情報を含めてください：

```bash
# システム情報
uname -a                    # OS情報
node --version             # Node.jsバージョン
npm --version              # npmバージョン

# エラーログ
cd backend && npm run dev 2>&1 | tee error.log
# error.log ファイルを添付

# ブラウザ情報
# F12 > Console のスクリーンショット
```

**💡 困ったときのヒント：**
- まずは再起動（ブラウザ、サーバー、PC）を試す
- エラーメッセージは必ず最後まで読む
- 設定を変更した場合は元に戻してみる
- 同じ環境で動いている人に相談する

## 🤝 コントリビューション

プロジェクトの改善にご協力いただける場合：

1. フォークして機能ブランチを作成
2. 変更をコミット
3. プルリクエストを作成

### 開発環境の品質チェック
```bash
# すべてのチェックを実行
cd frontend && npm run typecheck && npm run build
cd ../backend && npm run typecheck && npm run build
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 📞 サポート

- **Issues**: GitHubのIssuesでバグ報告・機能要望
- **Wiki**: 詳細なセットアップガイド
- **Discussions**: 質問・議論用

---

**🎯 Smart Display で、あなたの空間をよりスマートに！**