import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import route handlers
// import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
// import alertsRoutes from './routes/alerts';
// import messagesRoutes from './routes/messages';
// import settingsRoutes from './routes/settings';
// import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MediTrack Lite API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
// app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
// app.use('/api/alerts', alertsRoutes);
// app.use('/api/messages', messagesRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/health', healthRoutes);

// API endpoints placeholder
app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 MediTrack Lite API server running on port ${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;