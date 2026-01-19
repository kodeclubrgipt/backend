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
  const baseUrl = env.BACKEND_URL.replace(/\/$/, '');
  const callbackURL = `${baseUrl}/api/auth/google/callback`;

  console.log('🔧 Configuring Google OAuth Strategy');
  console.log('   Callback URL:', callbackURL);

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

          // Create new user (profile not complete yet)
          user = await User.create({
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            googleId: profile.id,
            provider: 'google',
            isEmailVerified: true,
            profileComplete: false, // New users need to set username
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
    throw new Error('JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

// Google OAuth routes
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.redirect(`${env.FRONTEND_URL}/login?error=no_user`);
        }

        const user = req.user;
        const token = generateToken(user._id.toString());
        const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');

        console.log(`🔑 Login Success: User "${req.user.name}" (${req.user.email}) logged in via Google.`);

        // Check if profile is complete
        if (!user.profileComplete || !user.username) {
          // Redirect to profile setup page
          res.redirect(`${frontendUrl}/auth/callback?token=${token}&setup=true`);
        } else {
          // Profile is complete, redirect normally
          res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
        }
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        res.redirect(`${env.FRONTEND_URL}/login?error=authentication_failed`);
      }
    }
  );
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.',
    });
  });
}

// Setup profile (set username after Google signup)
router.post(
  '/setup-profile',
  authenticate,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-20 characters, alphanumeric and underscores only'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters'),
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

      const { username, name } = req.body;
      const userId = req.user._id;

      // Check if username is already taken
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }

      // Update user profile
      const user = await User.findByIdAndUpdate(
        userId,
        {
          username: username.toLowerCase(),
          name: name,
          profileComplete: true,
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile setup complete',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          provider: user.provider,
          isAdmin: user.isAdmin,
          profileComplete: user.profileComplete,
          memberSince: user.memberSince,
          totalSolved: user.totalSolved,
          currentStreak: user.currentStreak,
          globalRank: user.globalRank,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Profile setup failed',
      });
    }
  }
);

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.json({ available: false, message: 'Invalid username format' });
    }

    const existingUser = await User.findOne({ username });
    res.json({
      available: !existingUser,
      message: existingUser ? 'Username is taken' : 'Username is available'
    });
  } catch (error) {
    res.status(500).json({ available: false, message: 'Error checking username' });
  }
});

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
        username: user.username,
        avatar: user.avatar,
        provider: user.provider,
        isAdmin: isAdminUser,
        profileComplete: user.profileComplete,
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
