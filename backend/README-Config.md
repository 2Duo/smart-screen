# 設定管理システム - 使用ガイド

## 概要

このプロジェクトでは、堅牢で拡張可能な設定管理システムを実装しています。環境変数のバリデーション、環境別設定、AWS Secrets Manager との統合をサポートしています。

## 特徴

- ✅ **型安全な環境変数**: Zod スキーマによるバリデーション
- ✅ **環境別設定**: development/staging/production 用の設定ファイル  
- ✅ **AWS Secrets Manager 統合**: 機密情報の安全な管理
- ✅ **起動時検証**: 必要な設定の自動チェック
- ✅ **設定値の安全な取得**: 機密情報の適切な隠蔽

## 使用方法

### 基本的な使用

```typescript
import { configManager } from './config';

// 設定値の取得
const port = configManager.get('PORT');
const apiKey = configManager.get('OPENWEATHER_API_KEY');

// サービスの設定確認
const isWeatherConfigured = configManager.isServiceConfigured('weather');
const isGoogleOAuthConfigured = configManager.isServiceConfigured('google-oauth');

// 設定の一覧取得（機密情報は隠蔽される）
const allSettings = configManager.getAll();
console.log(allSettings);
```

### AWS Secrets Manager との統合

```typescript
import { configManager } from './config';

// シークレットの取得
const secrets = await configManager.getSecret('smart-display/production/secrets');

// 設定とシークレットのマージ
const configWithSecrets = await configManager.getConfigWithSecrets();
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd backend
npm install
```

### 2. 環境設定ファイルの作成

```bash
# ベース設定をコピー
cp .env.example .env

# 環境別設定（必要に応じて）
cp .env.example .env.development
cp .env.example .env.staging  
cp .env.example .env.production
```

### 3. 必要な環境変数の設定

最低限必要な設定：

```bash
# .env
NODE_ENV=development
OPENWEATHER_API_KEY=your_api_key_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 4. 設定の検証

アプリケーション起動時に自動的に設定が検証されます：

```bash
npm run dev
# ✅ Configuration validation successful
```

### 5. AWS Secrets Manager の設定（オプション）

本番環境での使用推奨：

```bash
# AWS 認証情報の設定
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SECRETS_MANAGER_SECRET_NAME=smart-display/production/secrets
```

## 環境変数一覧

### 必須設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API キー | なし |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID | なし |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | なし |

### オプション設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `NODE_ENV` | 実行環境 | `development` |
| `PORT` | サーバーポート | `3001` |
| `FRONTEND_URL` | フロントエンド URL | `http://localhost:5173` |
| `DEFAULT_CITY` | デフォルト都市 | `Tokyo` |
| `LOG_LEVEL` | ログレベル | `info` |

### AWS Secrets Manager 設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `AWS_REGION` | AWS リージョン | なし |
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー | なし |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットキー | なし |
| `SECRETS_MANAGER_SECRET_NAME` | シークレット名 | なし |

## AWS Secrets Manager の使用方法

### 1. シークレットの作成

```typescript
import { createOrUpdateSecrets } from './config/secretsManager';

const secrets = {
  OPENWEATHER_API_KEY: 'your_real_api_key',
  GOOGLE_CLIENT_ID: 'your_real_client_id',
  GOOGLE_CLIENT_SECRET: 'your_real_client_secret',
  JWT_SECRET: 'your_super_secure_jwt_secret'
};

await createOrUpdateSecrets('smart-display/production/secrets', secrets);
```

### 2. シークレットの取得

```typescript
import { configManager } from './config';

// 起動時の設定取得
const config = await configManager.getConfigWithSecrets();
```

### 3. セットアップスクリプトの実行

```typescript
import { setupSecretsManager } from './config/secretsManager';

// 初回セットアップ
await setupSecretsManager();
```

## トラブルシューティング

### 設定検証エラー

```
❌ Configuration validation failed:
Required secret 'OPENWEATHER_API_KEY' is missing for environment 'development'
```

**解決方法**: `.env` ファイルに必要な環境変数を設定してください。

### AWS Secrets Manager エラー

```
AWS Secrets Manager is not configured
```

**解決方法**: AWS 認証情報を環境変数に設定するか、IAM ロールを使用してください。

### 型エラー

```
Type 'string | undefined' is not assignable to type 'string'
```

**解決方法**: `configManager.get()` を使用して型安全に設定値を取得してください。

## セキュリティ上の注意事項

1. **機密情報の管理**
   - API キーやシークレットは `.env.local` ファイルで管理
   - `.env.local` は `.gitignore` に追加済み

2. **本番環境での推奨事項**
   - AWS Secrets Manager の使用
   - 環境変数での直接指定は避ける
   - 定期的なキーローテーション

3. **開発環境での注意**
   - 実際の本番キーは使用しない
   - テスト用のキーを使用する

## API Reference

### ConfigManager クラス

```typescript
class ConfigManager {
  // 設定値の取得
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K]
  
  // 全設定の取得
  getAll(includeSensitive?: boolean): Partial<EnvConfig>
  
  // サービス設定の確認
  isServiceConfigured(service: 'weather' | 'google-oauth' | 'aws-secrets'): boolean
  
  // AWS Secrets Manager からのシークレット取得
  async getSecret(secretName: string): Promise<any>
  
  // 設定とシークレットのマージ
  async getConfigWithSecrets(): Promise<EnvConfig & any>
  
  // 必須サービスの検証
  validateRequiredServices(): void
  
  // 設定の再読み込み
  reload(): void
}
```

## 既存コードの移行

### Before (直接 process.env を使用)

```typescript
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

if (!apiKey) {
  throw new Error('API key not configured');
}
```

### After (ConfigManager を使用)

```typescript
import { configManager } from './config';

const port = configManager.get('PORT');
const apiKey = configManager.get('OPENWEATHER_API_KEY');

// バリデーションは自動的に実行済み
```

## まとめ

この設定管理システムにより、アプリケーションの設定をより安全で保守しやすい方法で管理できます。開発環境では簡単な `.env` ファイルを使用し、本番環境では AWS Secrets Manager を活用して機密情報を適切に保護してください。