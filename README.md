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

## 🔧 本番環境での運用

### 本番ビルド
```bash
# フロントエンドのビルド
cd frontend
npm run build

# バックエンドのビルド
cd ../backend
npm run build
```

### 本番サーバーの起動
```bash
# バックエンド本番起動
cd backend
npm start

# フロントエンド配信（Nginxなど推奨）
# frontend/dist フォルダをWebサーバーで配信
```

### パフォーマンス最適化
- **Gzip圧縮**: 有効（161KB → さらに圧縮可能）
- **キャッシュ設定**: ブラウザキャッシュ対応
- **Code Splitting**: 動的インポートによる最適化済み

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

### よくある問題

#### 天気が表示されない
```bash
# APIキーを確認
cat backend/.env
# OPENWEATHER_API_KEY が設定されているか確認

# サーバーログを確認
cd backend
npm run dev
# エラーメッセージを確認
```

#### ページが真っ白になる
```bash
# ブラウザの開発者ツールを開く（F12）
# Console タブでエラーを確認

# ローカルストレージをクリア
localStorage.clear()
location.reload()
```

#### ポート競合エラー
```bash
# ポートを変更
cd frontend
PORT=5174 npm run dev

cd backend  
PORT=3002 npm run dev
```

### ログの確認
```bash
# バックエンドログ
cd backend
npm run dev

# フロントエンドログ
# ブラウザの開発者ツール（F12）> Console
```

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