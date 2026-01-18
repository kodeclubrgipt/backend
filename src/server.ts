import express from 'express';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import quizRoutes from './routes/quiz';
import { errorHandler } from './middleware/errorHandler';
import { connectDB, getConnectionStatus } from './config/database';
import { validateEnv, env } from './config/env';

// Validate environment variables before starting
validateEnv();

const app = express();
const PORT = parseInt(env.PORT, 10);
const FRONTEND_URL = env.FRONTEND_URL;

// Initialize Passport
app.use(passport.initialize());

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

// Health check with database status
app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({ 
    status: 'ok', 
    message: 'Kode Club API is running',
    database: {
      connected: dbStatus.readyState === 1,
      name: dbStatus.name,
      host: dbStatus.host,
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;
