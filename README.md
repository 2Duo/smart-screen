# Smart Display

スマートディスプレイアプリケーション - React + TypeScript + Node.js

## 概要

このプロジェクトは、ウィジェットベースのスマートディスプレイアプリケーションです。時計、天気、カレンダーなどのウィジェットをドラッグ&ドロップで自由に配置できます。

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Grid Layout
- Socket.io Client
- Zustand（状態管理）
- React Query（データ取得）

### バックエンド
- Node.js
- Express
- TypeScript
- Socket.io
- OpenWeatherMap API
- ConfigManager（設定管理）
- 環境別設定サポート

## プロジェクト構造

```
smart-display/
├── frontend/        # React TypeScript アプリ
├── backend/         # Express TypeScript サーバー
├── shared/          # 共通の型定義
└── docs/           # 設計資料
```

## セットアップ

### 必要な環境
- Node.js 18+
- npm または yarn

### インストール

1. 依存関係のインストール：
```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

2. 環境変数の設定：
```bash
# バックエンド
cd backend
cp .env.example .env
# .env ファイルを編集（OpenWeatherMap API キーなど）

# フロントエンド
cd ../frontend
cp .env.example .env
```

### 開発サーバーの起動

#### 自動起動（推奨）
```bash
# プロジェクトルートで実行
./start.sh
```

#### 手動起動
1. バックエンドサーバーの起動：
```bash
cd backend
npm run dev
```

2. フロントエンドサーバーの起動：
```bash
cd frontend
npm run dev
```

3. ブラウザで http://localhost:5173 にアクセス

## 機能

### 実装済み機能
- [x] プロジェクト基本構造
- [x] React + TypeScript セットアップ
- [x] Express + Socket.io サーバー
- [x] 基本的なウィジェット（時計、天気、カレンダー）
- [x] レイアウトの永続化
- [x] Liquid Glass エフェクトのスタイリング
- [x] 天気API統合（OpenWeatherMap）
- [x] 設定画面とテーマ切り替え機能
- [x] ドラッグ&ドロップ機能の完全実装
- [x] ウィジェット内レイアウト編集機能
- [x] 自動フォントサイズ調整機能
- [x] 設定管理システム（ConfigManager）
- [x] バックグラウンド画像のカスタマイズ

### 今後の実装予定
- [ ] 追加ウィジェット（ニュース、写真、メモ）
- [ ] レスポンシブ対応の強化
- [ ] 音声制御機能
- [ ] 複数画面対応

## 開発コマンド

### バックエンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run start    # 本番サーバー起動
npm run lint     # リンター実行
npm run typecheck # 型チェック
```

### フロントエンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run preview  # プレビューサーバー起動
npm run lint     # リンター実行
npm run typecheck # 型チェック
```

## 設定

### 環境設定
プロジェクトは複数の環境（development、staging、production）をサポートしています：

```bash
# 開発環境
backend/.env.development

# ステージング環境  
backend/.env.staging

# 本番環境
backend/.env.production
```

### OpenWeatherMap API
天気情報を取得するには OpenWeatherMap API キーが必要です：
1. https://openweathermap.org/ でアカウント作成
2. API キーを取得
3. 対応する環境の `.env` ファイルに `OPENWEATHER_API_KEY` を設定

### アプリ内設定
- **UIスタイル**: Liquid Glass エフェクトの有効/無効
- **背景設定**: 色やカスタム画像の設定
- **ウィジェット設定**: 各ウィジェットの表示オプションとレイアウト
- **自動フォントサイズ**: ウィジェット内テキストの自動サイズ調整

## ライセンス

MIT License