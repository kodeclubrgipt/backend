const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { env } = require('../config/env');

const router = express.Router();

// Configure Google OAuth Strategy (only if credentials are provided)
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  // Ensure BACKEND_URL doesn't have trailing slash
  const baseUrl = env.BACKEND_URL.replace(/\/$/, '');
  const callbackURL = `$https://backend-95ve.onrender.com/api/auth/google/callback`;
  
  console.log('🔧 Configuring Google OAuth Strategy');
  console.log('   Client ID:', env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  console.log('   Backend URL:', env.BACKEND_URL);
  console.log('   Callback URL:', callbackURL);
  console.log('   ⚠️  Make sure this exact URL is added to Google Cloud Console:');
  console.log('      Authorized redirect URIs:', callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link Google account to existing email account
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            googleId: profile.id,
            provider: 'google',
            isEmailVerified: true,
          });

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
}

// Generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'fallback-secret') {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, {
    expiresIn: expiresIn,
  });
};

// Register with email
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
        provider: 'email',
      });

      const token = generateToken(user._id.toString());

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
          memberSince: user.memberSince,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }
);

// Login with email
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check password
      if (!user.password || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id.toString());

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
          memberSince: user.memberSince,
          totalSolved: user.totalSolved,
          currentStreak: user.currentStreak,
          globalRank: user.globalRank,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }
);

// Google OAuth routes (only if Google OAuth is configured)
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    (req, res, next) => {
      const baseUrl = env.BACKEND_URL.replace(/\/$/, '');
      const callbackURL = `${baseUrl}/api/auth/google/callback`;
      console.log('🔵 Google OAuth initiated');
      console.log('   Expected callback URL:', callbackURL);
      console.log('   ⚠️  If you see redirect_uri_mismatch, add this URL to Google Cloud Console');
      next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    (req, res, next) => {
      console.log('🟢 Google OAuth callback received');
      next();
    },
    passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }),
    async (req, res) => {
      try {
        if (!req.user) {
          console.error('❌ No user object after Google OAuth');
          return res.redirect(`${env.FRONTEND_URL}/login?error=no_user`);
        }

        const user = req.user;
        console.log('✅ Google OAuth successful for user:', user.email);
        const token = generateToken(user._id.toString());

        // Ensure FRONTEND_URL doesn't have trailing slash
        const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');
        
        // Redirect to frontend callback page with token
        const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
        console.log('🔄 Redirecting to frontend:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');
        res.redirect(`${frontendUrl}/login?error=authentication_failed`);
      }
    }
  );
} else {
  // Return error if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.',
    });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.',
    });
  });
}

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin
    const ADMIN_EMAILS = [
      'jiwanji6756@gmail.com',
      'kodeclubrgipt@gmail.com',
    ];
    const isAdminUser = ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase() === user.email.toLowerCase()
    ) || user.isAdmin;

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        isAdmin: isAdminUser,
        memberSince: user.memberSince,
        totalSolved: user.totalSolved,
        currentStreak: user.currentStreak,
        globalRank: user.globalRank,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
});

module.exports = router;
