import express from 'express';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import path from 'path';

// SSL証明書の存在確認とHTTPS対応
export const createAppServer = () => {
  const app = express();
  
  // SSL証明書のパスを確認
  const keyPath = path.resolve(__dirname, '../server.key');
  const certPath = path.resolve(__dirname, '../server.crt');
  
  let server;
  let isHttps = false;
  
  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      // HTTPS サーバーを作成
      const credentials = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      server = createHttpsServer(credentials, app);
      isHttps = true;
      console.log('🔒 Backend HTTPS server created');
    } else {
      // HTTP サーバーを作成
      server = createServer(app);
      console.log('📡 Backend HTTP server created');
    }
  } catch (error) {
    console.log('SSL certificates not found, using HTTP');
    server = createServer(app);
    isHttps = false;
  }
  
  return { app, server, isHttps };
};