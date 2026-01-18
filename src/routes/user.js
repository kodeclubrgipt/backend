const express = require('express');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
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
      message: error.message || 'Failed to get profile',
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { name, avatar } = req.body;

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
      message: error.message || 'Failed to update profile',
    });
  }
});

module.exports = router;
