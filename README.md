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
- [x] 基本的なウィジェット（時計、天気）
- [x] レイアウトの永続化
- [x] Liquid Glass エフェクトのスタイリング

### 今後の実装予定
- [ ] 天気API統合
- [ ] ドラッグ&ドロップ機能の完全実装
- [ ] 追加ウィジェット（カレンダー、ニュース、写真）
- [ ] 設定画面
- [ ] テーマ切り替え機能
- [ ] レスポンシブ対応の強化

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

### OpenWeatherMap API
天気情報を取得するには OpenWeatherMap API キーが必要です：
1. https://openweathermap.org/ でアカウント作成
2. API キーを取得
3. `backend/.env` ファイルに設定

## ライセンス

MIT License