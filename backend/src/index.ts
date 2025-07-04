import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

// Basic routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Weather API routes
app.get('/api/weather', async (req, res) => {
  try {
    const { location = process.env.DEFAULT_CITY || 'Tokyo' } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenWeatherMap API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const baseUrl = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const weatherUrl = `${baseUrl}/weather?q=${encodeURIComponent(location as string)}&appid=${apiKey}&units=metric&lang=ja`;
    
    const response = await fetch(weatherUrl);
    const data: any = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Weather data not found',
        timestamp: new Date().toISOString()
      });
    }

    const weatherData = {
      location: data.name,
      current: {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: mapWeatherIcon(data.weather[0].icon),
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg || 0,
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
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      timestamp: new Date().toISOString()
    });
  }
});

// City search endpoint
app.get('/api/weather/cities', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter must be at least 2 characters',
        timestamp: new Date().toISOString()
      });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenWeatherMap API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`;
    const response = await fetch(geoUrl);
    const data: any = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Failed to search cities',
        timestamp: new Date().toISOString()
      });
    }

    const cities = data.map((city: any) => ({
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
      displayName: city.state 
        ? `${city.name}, ${city.state}, ${city.country}`
        : `${city.name}, ${city.country}`
    }));

    return res.json({
      success: true,
      data: cities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('City search error:', error);
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle widget layout updates
  socket.on('layout-update', (layoutData) => {
    console.log('Layout update received:', layoutData);
    // Broadcast to all other clients
    socket.broadcast.emit('layout-updated', layoutData);
  });

  // Handle widget data requests
  socket.on('widget-data-request', (widgetType) => {
    console.log('Widget data request:', widgetType);
    // TODO: Implement widget data fetching
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Smart Display Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});