require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const optionalEnvVars = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
};

// Check for required environment variables
const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('Make sure you have created a .env file in the backend directory.');
    process.exit(1);
  }

  // Warn about insecure JWT secret
  if (process.env.JWT_SECRET === 'fallback-secret' || 
      process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-min-32-characters' ||
      (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32)) {
    console.warn('⚠️  WARNING: JWT_SECRET is not secure. Please use a strong random string (min 32 characters).');
  }

  // Warn if Google OAuth is not configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  WARNING: Google OAuth credentials not configured. Google login will not work.');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file to enable Google OAuth.');
  } else {
    console.log('✅ Google OAuth credentials configured');
  }
};

// Export environment variables with defaults
const env = {
  ...optionalEnvVars,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};

module.exports = {
  validateEnv,
  env,
  default: env,
};
