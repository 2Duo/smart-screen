import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { InputValidator, HTMLEscaper } from './utils/validation';

dotenv.config();

const app = express();
const server = createServer(app);
// Socket.io connection tracking for rate limiting
const socketConnections = new Map<string, { count: number; lastConnected: number }>();

const io = new Server(server, {
  cors: {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5174", // Alternative dev port
        process.env.PRODUCTION_FRONTEND_URL || "https://yourdomain.com",
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Socket.IO: Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  allowEIO3: false,
  // Connection limits
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

const PORT = process.env.PORT || 3001;

// Trust proxy for HTTPS enforcement
app.set('trust proxy', true);

// HTTPS enforcement middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use IP address and User-Agent for more accurate identification
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${userAgent.slice(0, 50)}`;
  }
});

const weatherApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // limit each IP to 30 requests per windowMs for weather API
  message: {
    error: 'Too many weather API requests, please try again later.',
    retryAfter: 10 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const apiKey = req.query.apiKey || req.headers['x-api-key'] || 'no-key';
    return `weather:${ip}:${apiKey}`;
  }
});

const calendarApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for calendar API
  message: {
    error: 'Too many calendar API requests, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 health check requests per minute
  message: {
    error: 'Too many health check requests, please try again later.',
    retryAfter: 1 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "wss:", "ws:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  crossOriginEmbedderPolicy: false,
  dnsPrefetchControl: { allow: false },
  ieNoOpen: true,
  originAgentCluster: true,
}));

// CORS configuration with stricter settings
const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174", // Alternative dev port
      process.env.PRODUCTION_FRONTEND_URL || "https://yourdomain.com",
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Basic routes
app.get('/health', healthCheckLimiter, (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Security.txt endpoint
app.get(['/security.txt', '/.well-known/security.txt'], (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Contact: security@smartscreen.example.com
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Encryption: https://smartscreen.example.com/pgp-key.txt
Preferred-Languages: en, ja
Policy: https://smartscreen.example.com/security-policy
Hiring: https://smartscreen.example.com/jobs
Acknowledgments: https://smartscreen.example.com/security-acknowledgments`);
});

// Weather API routes
app.get('/api/weather', weatherApiLimiter, async (req, res) => {
  const { location = process.env.DEFAULT_CITY || 'Tokyo' } = req.query;
  
  try {
    
    // Validate location parameter
    const locationValidation = InputValidator.validateLocation(location);
    if (!locationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: locationValidation.error,
        timestamp: new Date().toISOString()
      });
    }
    
    const sanitizedLocation = locationValidation.sanitized!;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenWeatherMap API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const baseUrl = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const weatherUrl = `${baseUrl}/weather?q=${encodeURIComponent(sanitizedLocation)}&appid=${apiKey}&units=metric&lang=ja`;
    const forecastUrl = `${baseUrl}/forecast?q=${encodeURIComponent(sanitizedLocation)}&appid=${apiKey}&units=metric&lang=ja`;
    
    // Get weather, forecast, and geocoding data
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(sanitizedLocation)}&limit=1&appid=${apiKey}`;
    
    const [weatherResponse, forecastResponse, geoResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
      axios.get(geoUrl)
    ]);
    
    const data: any = weatherResponse.data;
    const forecastData: any = forecastResponse.data;
    const geoData: any = geoResponse.data[0] || null;
    
    // Create formatted location name
    const formatLocationName = (weatherData: any, geoData: any) => {
      const cityName = weatherData.name; // Japanese city name from weather API
      
      if (geoData && geoData.state) {
        // If we have state/prefecture information, use it
        return `${geoData.state}, ${cityName}`;
      }
      
      // For Japan, try to extract prefecture from the city name or use mapping
      if (weatherData.sys.country === 'JP') {
        // Common Japanese prefecture mappings
        const prefectureMap: { [key: string]: string } = {
          '東京都': '東京都',
          '大阪市': '大阪府, 大阪市',
          '横浜市': '神奈川県, 横浜市',
          '京都市': '京都府, 京都市',
          '札幌市': '北海道, 札幌市',
          '神戸市': '兵庫県, 神戸市',
          '名古屋市': '愛知県, 名古屋市',
          '福岡市': '福岡県, 福岡市',
          '仙台市': '宮城県, 仙台市',
          '広島市': '広島県, 広島市',
          '千葉市': '千葉県, 千葉市',
          '北九州市': '福岡県, 北九州市',
          'さいたま市': '埼玉県, さいたま市',
          '新潟市': '新潟県, 新潟市',
          '浜松市': '静岡県, 浜松市',
          '熊本市': '熊本県, 熊本市',
          '相模原市': '神奈川県, 相模原市',
          '岡山市': '岡山県, 岡山市',
          '静岡市': '静岡県, 静岡市',
          '奈良市': '奈良県, 奈良市'
        };
        
        if (prefectureMap[cityName]) {
          return prefectureMap[cityName];
        }
        
        // If city name already contains prefecture (like 東京都), return as is
        if (cityName.includes('都') || cityName.includes('府') || cityName.includes('県')) {
          return cityName;
        }
      }
      
      // Default fallback
      return cityName;
    };
    
    const formattedLocation = formatLocationName(data, geoData);
    
    // Calculate daily precipitation probability from remainder of today's forecast entries
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Filter forecast entries for remainder of today (from now until end of day)
    const todayForecasts =
      forecastData.list?.filter((entry: any) => {
        const entryDate = new Date(entry.dt * 1000);
        return entryDate >= now && entryDate < todayEnd;
      }) || [];

    // OpenWeather's pop value is given for each 3h period. To estimate the
    // probability that it rains at any point today we combine the values by
    // calculating 1 - Π(1 - pop).
    let combinedPop = 0;
    if (todayForecasts.length > 0) {
      const noRainProbability = todayForecasts.reduce(
        (acc: number, entry: any) => acc * (1 - (entry.pop || 0)),
        1
      );
      combinedPop = Math.round((1 - noRainProbability) * 100);
    }

    const precipitationProbability = combinedPop;

    // Calculate rain periods - identify time periods with significant precipitation probability
    const rainPeriods: Array<{ start: string; end: string; probability: number }> = [];
    const rainThreshold = 0.3; // 30% threshold for considering it a rain period
    
    let currentRainPeriod: { start: Date; end: Date; maxProbability: number } | null = null;
    
    todayForecasts.forEach((entry: any, index: number) => {
      const entryDate = new Date(entry.dt * 1000);
      const pop = entry.pop || 0;
      
      if (pop >= rainThreshold) {
        if (!currentRainPeriod) {
          // Start a new rain period
          currentRainPeriod = {
            start: entryDate,
            end: new Date(entryDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
            maxProbability: pop
          };
        } else {
          // Extend current rain period
          currentRainPeriod.end = new Date(entryDate.getTime() + 3 * 60 * 60 * 1000);
          currentRainPeriod.maxProbability = Math.max(currentRainPeriod.maxProbability, pop);
        }
      } else {
        // End current rain period if it exists
        if (currentRainPeriod) {
          rainPeriods.push({
            start: currentRainPeriod.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            end: currentRainPeriod.end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            probability: Math.round(currentRainPeriod.maxProbability * 100)
          });
          currentRainPeriod = null;
        }
      }
    });
    
    // Don't forget to add the last rain period if it exists
    if (currentRainPeriod !== null && currentRainPeriod.start && currentRainPeriod.end && typeof currentRainPeriod.maxProbability === 'number') {
      rainPeriods.push({
        start: currentRainPeriod.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        end: currentRainPeriod.end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        probability: Math.round(currentRainPeriod.maxProbability * 100)
      });
    }

    const weatherData = {
      location: HTMLEscaper.escape(formattedLocation),
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        seaLevel: data.main.sea_level,
        groundLevel: data.main.grnd_level,
        description: HTMLEscaper.escape(data.weather[0].description),
        icon: mapWeatherIcon(data.weather[0].icon),
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        windGust: data.wind?.gust || 0,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : 0, // Convert to km
        cloudiness: data.clouds?.all || 0,
        sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '',
        sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '',
        uvIndex: data.uvi || 0,
        precipitationProbability: precipitationProbability,
        rainPeriods: rainPeriods,
      },
      forecast: [],
      lastUpdated: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: weatherData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.message || error.message;
      
      if (statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: `City not found: ${HTMLEscaper.escape(location as string)}`,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      timestamp: new Date().toISOString()
    });
  }
});

// City search endpoint
app.get('/api/weather/cities', weatherApiLimiter, async (req, res) => {
  try {
    const { q } = req.query;
    
    // Validate search query parameter
    const queryValidation = InputValidator.validateSearchQuery(q);
    if (!queryValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: queryValidation.error,
        timestamp: new Date().toISOString()
      });
    }
    
    const sanitizedQuery = queryValidation.sanitized!;

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenWeatherMap API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(sanitizedQuery)}&limit=5&appid=${apiKey}`;
    const response = await axios.get(geoUrl);
    const data: any = response.data;

    const cities = data.map((city: any) => ({
      name: HTMLEscaper.escape(city.name || ''),
      country: HTMLEscaper.escape(city.country || ''),
      state: HTMLEscaper.escape(city.state || ''),
      lat: city.lat,
      lon: city.lon,
      displayName: city.state 
        ? `${HTMLEscaper.escape(city.name || '')}, ${HTMLEscaper.escape(city.state || '')}, ${HTMLEscaper.escape(city.country || '')}`
        : `${HTMLEscaper.escape(city.name || '')}, ${HTMLEscaper.escape(city.country || '')}`
    }));

    return res.json({
      success: true,
      data: cities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('City search error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.message || error.message;
      
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to search cities',
      timestamp: new Date().toISOString()
    });
  }
});

// Weather icon mapping function
function mapWeatherIcon(iconCode: string): string {
  const iconMap: { [key: string]: string } = {
    '01d': 'clear-day',
    '01n': 'clear-night',
    '02d': 'partly-cloudy-day',
    '02n': 'partly-cloudy-night',
    '03d': 'cloudy',
    '03n': 'cloudy',
    '04d': 'cloudy',
    '04n': 'cloudy',
    '09d': 'rain',
    '09n': 'rain',
    '10d': 'rain',
    '10n': 'rain',
    '11d': 'rain',
    '11n': 'rain',
    '13d': 'snow',
    '13n': 'snow',
    '50d': 'cloudy',
    '50n': 'cloudy',
  };
  return iconMap[iconCode] || 'default';
}

// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/callback'
);

// Token storage management with path validation
const TOKENS_FILE_PATH = (() => {
  const basePath = path.join(__dirname, '..', 'data', 'tokens.json');
  const pathValidation = InputValidator.validateFilePath(basePath);
  if (!pathValidation.isValid) {
    throw new Error(`Invalid tokens file path: ${pathValidation.error}`);
  }
  return path.resolve(basePath);
})();

// Ensure data directory exists securely
const dataDir = path.dirname(TOKENS_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 }); // Restrict permissions
}

// Load tokens from file
function loadTokens(): { [key: string]: any } {
  try {
    if (fs.existsSync(TOKENS_FILE_PATH)) {
      const data = fs.readFileSync(TOKENS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading tokens:', error);
  }
  return {};
}

// Save tokens to file
function saveTokens(tokens: { [key: string]: any }): void {
  try {
    fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
}

// Store tokens persistently
let userTokens: { [key: string]: any } = loadTokens();

// Check if access token is valid and refresh if needed
async function ensureValidTokens(userId: string = 'default'): Promise<boolean> {
  try {
    const tokens = userTokens[userId];
    if (!tokens) {
      return false;
    }

    // Set the tokens to the OAuth client
    oauth2Client.setCredentials(tokens);

    // Check if access token is expired or about to expire (within 5 minutes)
    const expiryDate = tokens.expiry_date;
    if (expiryDate && expiryDate <= Date.now() + 5 * 60 * 1000) {
      console.log('Access token expired or expiring soon, refreshing...');
      
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      userTokens[userId] = credentials;
      saveTokens(userTokens);
      
      console.log('Tokens refreshed successfully');
    }

    return true;
  } catch (error) {
    console.error('Error ensuring valid tokens:', error);
    
    // If refresh fails, remove invalid tokens
    delete userTokens[userId];
    saveTokens(userTokens);
    
    return false;
  }
}

// Google Calendar API routes
app.get('/api/calendar/auth', calendarApiLimiter, (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Google Calendar API credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.',
        timestamp: new Date().toISOString()
      });
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });

    return res.json({
      success: true,
      data: { authUrl },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calendar auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate auth URL',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/calendar/callback', calendarApiLimiter, async (req, res) => {
  try {
    const { code } = req.query;
    
    // Validate authorization code
    if (!code || typeof code !== 'string' || code.length < 10 || code.length > 500 || !/^[A-Za-z0-9._-]+$/.test(code)) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>認証エラー</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .error { color: #dc3545; margin-bottom: 1rem; }
            button { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ 認証に失敗しました</div>
            <p>認証コードが見つかりません。</p>
            <button onclick="closeWindow()">閉じる</button>
          </div>
          <script>
            function closeWindow() {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'calendar-auth', 
                  success: false, 
                  error: 'Authorization code is required',
                  closeWindow: true 
                }, '*');
              }
              try {
                window.close();
              } catch (e) {
                console.warn('Could not close window:', e);
              }
            }
            
            if (window.opener) {
              window.opener.postMessage({ type: 'calendar-auth', success: false, error: 'Authorization code is required' }, '*');
            }
            setTimeout(() => closeWindow(), 3000);
          </script>
        </body>
        </html>
      `);
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens persistently
    userTokens['default'] = tokens;
    saveTokens(userTokens);

    // Show success page with auto-close
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>認証完了</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .success { color: #28a745; font-size: 1.2rem; margin-bottom: 1rem; }
          .countdown { color: #6c757d; font-size: 0.9rem; margin-top: 1rem; }
          button { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem; }
          .close-message { color: #dc3545; font-size: 0.9rem; margin-top: 1rem; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Googleカレンダーの認証が完了しました</div>
          <p>このウィンドウは自動的に閉じられます。</p>
          <button onclick="closeWindow()">今すぐ閉じる</button>
          <div class="countdown" id="countdown">3秒後に自動的に閉じます</div>
          <div class="close-message" id="closeMessage">
            ウィンドウが自動的に閉じない場合は、手動で閉じてください。
          </div>
        </div>
        <script>
          function closeWindow() {
            // Notify parent window and request close
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'calendar-auth', 
                success: true, 
                closeWindow: true 
              }, '*');
            }
            
            // Try to close the window
            try {
              window.close();
            } catch (e) {
              // If closing fails, show message
              document.getElementById('closeMessage').style.display = 'block';
              document.getElementById('countdown').style.display = 'none';
            }
            
            // Fallback: try to close after a short delay
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                // Show manual close message if all attempts fail
                document.getElementById('closeMessage').style.display = 'block';
                document.getElementById('countdown').style.display = 'none';
              }
            }, 100);
          }
          
          // Notify parent window of successful authentication
          if (window.opener) {
            window.opener.postMessage({ type: 'calendar-auth', success: true }, '*');
          }
          
          // Countdown timer
          let countdown = 3;
          const countdownEl = document.getElementById('countdown');
          const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              countdownEl.textContent = countdown + '秒後に自動的に閉じます';
            } else {
              clearInterval(timer);
              closeWindow();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Calendar callback error:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>認証エラー</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .error { color: #dc3545; margin-bottom: 1rem; }
          button { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">❌ 認証に失敗しました</div>
          <p>エラーが発生しました。もう一度お試しください。</p>
          <button onclick="closeWindow()">閉じる</button>
        </div>
        <script>
          function closeWindow() {
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'calendar-auth', 
                success: false, 
                error: 'Authentication failed',
                closeWindow: true 
              }, '*');
            }
            try {
              window.close();
            } catch (e) {
              console.warn('Could not close window:', e);
            }
          }
          
          if (window.opener) {
            window.opener.postMessage({ type: 'calendar-auth', success: false, error: 'Authentication failed' }, '*');
          }
          setTimeout(() => closeWindow(), 3000);
        </script>
      </body>
      </html>
    `);
  }
});

app.get('/api/calendar/events', calendarApiLimiter, async (req, res) => {
  try {
    // Ensure tokens are valid and refresh if needed
    const isAuthenticated = await ensureValidTokens('default');
    
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get days parameter from query (default to 7 days)
    const daysParam = req.query.days;
    
    // Validate days parameter
    const daysValidation = InputValidator.validateNumberParameter(daysParam, 1, 30);
    if (!daysValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: daysValidation.error,
        timestamp: new Date().toISOString()
      });
    }
    
    const validDays: number = daysValidation.sanitized || 7;

    const now = new Date();
    const endDate = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: Math.min(50, validDays * 5), // Adjust max results based on days
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    const formattedEvents = events.map(event => ({
      id: HTMLEscaper.escape(event.id || ''),
      title: HTMLEscaper.escape(event.summary || 'No title'),
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: HTMLEscaper.escape(event.location || ''),
      description: HTMLEscaper.escape(event.description || ''),
      isAllDay: !event.start?.dateTime,
      calendarId: 'primary',
      calendarName: 'Primary Calendar',
      attendees: event.attendees?.map(attendee => HTMLEscaper.escape(attendee.email || '')) || [],
      status: event.status as 'confirmed' | 'tentative' | 'cancelled' || 'confirmed',
      recurring: !!event.recurringEventId,
    }));

    const calendarData = {
      events: formattedEvents,
      nextWeekEvents: formattedEvents,
      lastUpdated: new Date().toISOString(),
      isAuthenticated: true,
    };

    return res.json({
      success: true,
      data: calendarData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    
    if ((error as any).code === 401) {
      // Token expired, need to re-authenticate
      delete userTokens['default'];
      return res.status(401).json({
        success: false,
        error: 'Authentication expired. Please re-authenticate.',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/calendar/status', calendarApiLimiter, async (req, res) => {
  try {
    const isAuthenticated = await ensureValidTokens('default');
    
    res.json({
      success: true,
      data: {
        isAuthenticated,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calendar status check error:', error);
    res.json({
      success: true,
      data: {
        isAuthenticated: false,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Socket.io connection handling with rate limiting
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  const now = Date.now();
  const maxConnectionsPerIp = 5; // Maximum concurrent connections per IP
  const connectionWindowMs = 60 * 1000; // 1 minute window
  
  // Check connection limits
  const clientData = socketConnections.get(clientIp) || { count: 0, lastConnected: now };
  
  // Clean up old connections
  if (now - clientData.lastConnected > connectionWindowMs) {
    clientData.count = 0;
  }
  
  if (clientData.count >= maxConnectionsPerIp) {
    console.warn(`Connection limit exceeded for IP ${clientIp}`);
    socket.emit('error', { 
      message: 'Too many connections from this IP. Please try again later.',
      type: 'rate_limit',
      retryAfter: connectionWindowMs
    });
    socket.disconnect(true);
    return;
  }
  
  // Update connection count
  clientData.count += 1;
  clientData.lastConnected = now;
  socketConnections.set(clientIp, clientData);
  
  console.log(`Client connected: ${socket.id} (IP: ${clientIp}, Connections: ${clientData.count})`);
  
  // Rate limiting for events
  const eventRateLimiter = new Map<string, number>();
  const eventRateLimit = 10; // Max 10 events per minute per socket
  const eventWindowMs = 60 * 1000; // 1 minute
  
  const checkEventRateLimit = (eventName: string): boolean => {
    const currentTime = Date.now();
    const eventKey = `${socket.id}:${eventName}`;
    const lastEventTime = eventRateLimiter.get(eventKey) || 0;
    const timeSinceLastEvent = currentTime - lastEventTime;
    
    if (timeSinceLastEvent < eventWindowMs / eventRateLimit) {
      return false; // Rate limit exceeded
    }
    
    eventRateLimiter.set(eventKey, currentTime);
    return true;
  };
  
  // Handle widget layout updates
  socket.on('layout-update', (layoutData) => {
    try {
      // Check event rate limit
      if (!checkEventRateLimit('layout-update')) {
        socket.emit('error', { 
          message: 'Event rate limit exceeded. Please slow down.',
          type: 'rate_limit' 
        });
        return;
      }
      
      // Validate payload size and content
      const payloadValidation = InputValidator.validateSocketPayload(layoutData);
      if (!payloadValidation.isValid) {
        console.warn(`Invalid layout-update payload from ${socket.id}: ${payloadValidation.error}`);
        socket.emit('error', { message: 'Invalid payload', type: 'validation' });
        return;
      }
      
      console.log('Layout update received:', layoutData);
      
      // Sanitize the layout data before broadcasting
      const sanitizedLayoutData = HTMLEscaper.escapeJSON(layoutData);
      
      // Broadcast to all other clients
      socket.broadcast.emit('layout-updated', sanitizedLayoutData);
    } catch (error) {
      console.error('Error processing layout-update:', error);
      socket.emit('error', { message: 'Failed to process layout update', type: 'server_error' });
    }
  });

  // Handle widget data requests
  socket.on('widget-data-request', (widgetType) => {
    try {
      // Check event rate limit
      if (!checkEventRateLimit('widget-data-request')) {
        socket.emit('error', { 
          message: 'Event rate limit exceeded. Please slow down.',
          type: 'rate_limit' 
        });
        return;
      }
      
      // Validate widget type
      const typeValidation = InputValidator.validateSocketEventType(widgetType);
      if (!typeValidation.isValid) {
        console.warn(`Invalid widget-data-request type from ${socket.id}: ${typeValidation.error}`);
        socket.emit('error', { message: 'Invalid widget type', type: 'validation' });
        return;
      }
      
      const sanitizedWidgetType = typeValidation.sanitized!;
      console.log('Widget data request:', sanitizedWidgetType);
      
      // TODO: Implement widget data fetching with sanitized widget type
      socket.emit('widget-data-response', { 
        type: sanitizedWidgetType, 
        message: 'Feature not implemented yet' 
      });
    } catch (error) {
      console.error('Error processing widget-data-request:', error);
      socket.emit('error', { message: 'Failed to process widget data request', type: 'server_error' });
    }
  });

  socket.on('disconnect', () => {
    // Decrease connection count
    const clientData = socketConnections.get(clientIp);
    if (clientData) {
      clientData.count = Math.max(0, clientData.count - 1);
      if (clientData.count === 0) {
        socketConnections.delete(clientIp);
      } else {
        socketConnections.set(clientIp, clientData);
      }
    }
    
    console.log(`Client disconnected: ${socket.id} (IP: ${clientIp})`);
  });
  
  // Handle any unrecognized events
  socket.onAny((eventName, ...args) => {
    const recognizedEvents = ['layout-update', 'widget-data-request', 'disconnect'];
    if (!recognizedEvents.includes(eventName)) {
      console.warn(`Unrecognized event '${eventName}' from ${socket.id}`);
      socket.emit('error', { message: 'Unrecognized event', type: 'validation' });
    }
  });
});

// Periodic cleanup of socket connection data to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [ip, data] of socketConnections.entries()) {
    if (now - data.lastConnected > cleanupThreshold) {
      socketConnections.delete(ip);
    }
  }
  
  console.log(`Socket connections cleanup: ${socketConnections.size} active IPs`);
}, 60 * 60 * 1000); // Cleanup every hour

// Security logging middleware
app.use((req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // Script injection
    /javascript:/i,  // JavaScript protocol
    /on\w+\s*=/i,  // Event handlers
  ];
  
  const fullUrl = req.url;
  const userAgent = req.get('User-Agent') || '';
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(userAgent)) {
      console.warn(`Suspicious request detected from ${req.ip}: ${fullUrl} | UA: ${userAgent}`);
      break;
    }
  }
  
  next();
});

server.listen(PORT, () => {
  console.log(`Smart Display Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Security measures enabled: Rate limiting, Input validation, XSS protection, Path traversal protection`);
});