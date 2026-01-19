const express = require('express');
const User = require('../models/User');
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');

const router = express.Router();

// Get Global Leaderboard (Top Users by Total Solved)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ totalSolved: { $gt: 0 } })
            .select('name username avatar totalSolved currentStreak globalRank')
            .sort({ totalSolved: -1 })
            .limit(50);

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            username: user.username,
            displayName: user.username || user.name, // username preferred
            avatar: user.avatar,
            totalSolved: user.totalSolved,
            currentStreak: user.currentStreak,
            globalRank: user.globalRank
        }));

        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard'
        });
    }
});

// Get Leaderboard for a Specific Quiz
router.get('/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;

        const results = await Result.find({ quizId })
            .populate('userId', 'name username avatar')
            .sort({ score: -1, createdAt: 1 })
            .limit(50);

        const leaderboard = results.map((result, index) => ({
            rank: index + 1,
            name: result.userId.name,
            username: result.userId.username,
            displayName: result.userId.username || result.userId.name,
            avatar: result.userId.avatar,
            score: result.score,
            date: result.createdAt
        }));

        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz leaderboard'
        });
    }
});

module.exports = router;
