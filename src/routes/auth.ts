import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

const router = express.Router();

// Configure Google OAuth Strategy (only if credentials are provided)
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = `${env.BACKEND_URL}/api/auth/google/callback`;
  
  console.log('🔧 Configuring Google OAuth Strategy');
  console.log('   Client ID:', env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
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
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
}

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'fallback-secret') {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file');
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
  return jwt.sign({ userId }, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

// Register with email
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
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
    } catch (error: any) {
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
  async (req: Request, res: Response) => {
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
    } catch (error: any) {
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
    (req: Request, res: Response, next: any) => {
      console.log('🔵 Google OAuth initiated');
      console.log('   Callback URL:', `${env.BACKEND_URL}/api/auth/google/callback`);
      next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    (req: Request, res: Response, next: any) => {
      console.log('🟢 Google OAuth callback received');
      next();
    },
    passport.authenticate('google', { session: false }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        console.log('✅ Google OAuth successful for user:', user.email);
        const token = generateToken(user._id.toString());

        // Redirect to frontend with token
        res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
      } catch (error: any) {
        console.error('❌ Google OAuth error:', error);
        res.redirect(`${env.FRONTEND_URL}/login?error=authentication_failed`);
      }
    }
  );
} else {
  // Return error if Google OAuth is not configured
  router.get('/google', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.',
    });
  });

  router.get('/google/callback', (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.',
    });
  });
}

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user!;
    
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
});

export default router;
