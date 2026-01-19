const express = require('express');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');

const router = express.Router();

// Get user stats (dashboard)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch recent 5 results
    const recentResults = await Result.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('quizId', 'heading');

    // Calculate total attempts and average score
    const allResults = await Result.find({ userId });
    const totalAttempts = allResults.length;
    const averageScore = totalAttempts > 0
      ? allResults.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts
      : 0;

    // Get activity data (attempts per day for last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);

    // Group by date logic could be added here for the graph
    // For now returning last 7 days placeholder or actual aggregation if needed

    res.json({
      success: true,
      stats: {
        totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
        recentActivity: recentResults.map(r => ({
          quizTitle: r.quizId?.heading || 'Deleted Quiz',
          score: r.score,
          date: r.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats',
    });
  }
});

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
