const express = require('express');
const cors = require('cors');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB, getConnectionStatus } = require('./config/database');
const { validateEnv, env } = require('./config/env');

// Validate environment variables before starting
validateEnv();

const app = express();
const PORT = parseInt(env.PORT, 10);
const FRONTEND_URL = env.FRONTEND_URL;

// Initialize Passport
app.use(passport.initialize());

// Middleware
// CORS configuration - allow frontend origin
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow frontend URL
    if (origin === FRONTEND_URL) {
      return callback(null, true);
    }
    
    // In development, allow localhost
    if (FRONTEND_URL.includes('localhost') && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log('⚠️  CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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

module.exports = app;
