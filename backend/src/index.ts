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

app.get('/api/weather', async (req, res) => {
  // Weather API endpoint placeholder
  res.json({ message: 'Weather API endpoint - implementation needed' });
});

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