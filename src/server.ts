import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import propertyRoutes from './routes/propertyRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORS - Allow all origins in production (or specify your frontend URL)
app.use(
  cors({
    origin: process.env.FRONTEND_URL === '*' ? '*' : process.env.FRONTEND_URL || 'http://localhost:8081',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '🏠 Real Estate Agent API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
      console.log(`📡 Listening on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;