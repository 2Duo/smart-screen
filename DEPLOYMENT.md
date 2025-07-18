# 🚀 Smart Display 本番環境デプロイメントガイド

本格的な本番環境（Raspberry Pi、専用サーバー、クラウド等）での運用方法を説明します。

## 🎯 デプロイメント方法の選択

### 推奨環境別の選択

| 環境 | 推奨方法 | 難易度 | 安定性 |
|------|----------|--------|--------|
| 家庭用タブレット | 開発サーバー | ⭐ | ⭐⭐⭐ |
| Raspberry Pi | Docker | ⭐⭐ | ⭐⭐⭐⭐ |
| VPS/クラウド | Nginx + PM2 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 企業環境 | Kubernetes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🐳 Docker での運用（推奨）

### Dockerファイルの作成

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose設定

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend  
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 起動手順

```bash
# 1. 環境変数ファイルを作成
echo "OPENWEATHER_API_KEY=your_api_key_here" > .env

# 2. Docker Composeで起動
docker-compose up -d

# 3. 確認
docker-compose ps
curl http://localhost/health
```

## 🔧 Nginx + PM2 での運用

### PM2のインストールと設定

```bash
# PM2をグローバルインストール
npm install -g pm2

# ecosystem.config.js を作成
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'smart-display-backend',
    script: './backend/dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF
```

### Nginx設定

```nginx
# /etc/nginx/sites-available/smartdisplay
server {
    listen 80;
    server_name your-domain.com;
    
    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # フロントエンド（静的ファイル）
    location / {
        root /var/www/smartdisplay/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # キャッシュ設定
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # バックエンドAPI
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### デプロイスクリプト

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Smart Display デプロイメント開始..."

# 1. バックアップ
echo "📦 現在の設定をバックアップ..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/smartdisplay

# 2. ビルド
echo "🔨 フロントエンドビルド..."
cd frontend
npm ci
npm run build

echo "🔨 バックエンドビルド..."
cd ../backend
npm ci  
npm run build

# 3. ファイルのコピー
echo "📁 ファイルをコピー..."
sudo cp -r frontend/dist/* /var/www/smartdisplay/frontend/dist/
sudo cp -r backend/dist/* /var/www/smartdisplay/backend/dist/
sudo cp -r backend/node_modules /var/www/smartdisplay/backend/

# 4. 権限設定
echo "🔐 権限を設定..."
sudo chown -R www-data:www-data /var/www/smartdisplay
sudo chmod -R 755 /var/www/smartdisplay

# 5. サービス再起動
echo "🔄 サービスを再起動..."
pm2 restart ecosystem.config.js
sudo systemctl reload nginx

echo "✅ デプロイ完了！"
echo "🌐 http://your-domain.com でアクセス可能です"
```

## ☁️ クラウドデプロイメント

### Vercel（フロントエンド）+ Railway（バックエンド）

#### Vercel設定（vercel.json）

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Railway設定（railway.toml）

```toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[[services]]
name = "backend"
```

### AWS EC2 デプロイメント

```bash
# 1. EC2インスタンス作成（Ubuntu 22.04 LTS推奨）
# 2. セキュリティグループで80, 443, 22ポートを開放

# 3. 初期設定
sudo apt update
sudo apt install -y nginx nodejs npm git

# 4. Node.js 18をインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. プロジェクトのクローン
git clone https://github.com/your-repo/smart-screen.git
cd smart-screen

# 6. 環境設定
echo "OPENWEATHER_API_KEY=your_key" | sudo tee /etc/environment
echo "NODE_ENV=production" | sudo tee -a /etc/environment

# 7. ビルドとデプロイ
chmod +x deploy.sh
./deploy.sh
```

## 🔒 SSL/HTTPS設定

### Let's Encrypt（無料SSL）

```bash
# 1. Certbotインストール
sudo apt install certbot python3-certbot-nginx

# 2. SSL証明書取得
sudo certbot --nginx -d your-domain.com

# 3. 自動更新設定
sudo crontab -e
# 以下を追加
0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx HTTPS設定

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 他の設定は上記と同じ
}

# HTTP → HTTPS リダイレクト
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 監視とメンテナンス

### システム監視

```bash
# PM2 監視ダッシュボード
pm2 monit

# ログ監視
pm2 logs --lines 100

# リソース使用量
htop
df -h
```

### 自動バックアップ

```bash
#!/bin/bash
# backup.sh - 毎日実行

BACKUP_DIR="/backup/smartdisplay"
DATE=$(date +%Y%m%d)

# データベース（設定）のバックアップ
mkdir -p $BACKUP_DIR/$DATE
cp -r /var/www/smartdisplay/data $BACKUP_DIR/$DATE/

# 古いバックアップを削除（30日以上前）
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

### ヘルスチェック

```bash
#!/bin/bash
# healthcheck.sh

# APIヘルスチェック
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend is down, restarting..."
    pm2 restart smart-display-backend
    
    # Slack通知（オプション）
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Smart Display backend restarted"}' \
        YOUR_SLACK_WEBHOOK_URL
fi
```

## 🚀 CI/CD パイプライン

### GitHub Actions設定

```yaml
# .github/workflows/deploy.yml
name: Deploy Smart Display

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install and Build
      run: |
        cd frontend && npm ci && npm run build
        cd ../backend && npm ci && npm run build
        
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/smartdisplay
          git pull origin main
          ./deploy.sh
```

## 🔧 パフォーマンス最適化

### データベース最適化（Redis）

```bash
# Redis インストール
sudo apt install redis-server

# Node.js でRedis使用
npm install redis
```

### CDN設定（CloudFlare）

1. CloudFlareアカウント作成
2. ドメインを追加
3. DNS設定を変更
4. ページルールで静的ファイルをキャッシュ

### 負荷分散（複数インスタンス）

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    # 他の設定
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

**💡 本番運用のベストプラクティス:**
- 定期的なバックアップとリストア手順の確認
- 監視アラートの設定
- セキュリティアップデートの定期実施
- 負荷テストとキャパシティプランニング
- 災害復旧計画の策定