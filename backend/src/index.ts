import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';

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
  const { location = process.env.DEFAULT_CITY || 'Tokyo' } = req.query;
  
  try {
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
    const forecastUrl = `${baseUrl}/forecast?q=${encodeURIComponent(location as string)}&appid=${apiKey}&units=metric&lang=ja`;
    
    // Get both current weather and forecast data
    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl)
    ]);
    
    const data: any = weatherResponse.data;
    const forecastData: any = forecastResponse.data;
    
    // Calculate daily precipitation probability from today's forecast entries
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Filter forecast entries for today only
    const todayForecasts =
      forecastData.list?.filter((entry: any) => {
        const entryDate = new Date(entry.dt * 1000);
        return entryDate >= todayStart && entryDate < todayEnd;
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

    const weatherData = {
      location: data.name,
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        seaLevel: data.main.sea_level,
        groundLevel: data.main.grnd_level,
        description: data.weather[0].description,
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
          error: `City not found: ${location}`,
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
    const response = await axios.get(geoUrl);
    const data: any = response.data;

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