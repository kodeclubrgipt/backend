const express = require('express');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');

const router = express.Router();

// Protected routes
router.use(authenticate);
router.use(isAdmin);

// Get dashboard overview stats
router.get('/dashboard', async (req, res) => {
    try {
        // 1. Basic Counts
        const totalUsers = await User.countDocuments();
        const totalQuizzes = await Quiz.countDocuments();
        const totalAttempts = await Result.countDocuments();

        // 2. Weekly Activity (Approximated by User creation and Result creation)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newUsersLast7Days = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const attemptsLast7Days = await Result.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // 3. Graph Data: Attempts over the last 7 days
        const dailyAttempts = await Result.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const graphData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const found = dailyAttempts.find(item => item._id === dateStr);
            graphData.push({
                date: dateStr,
                attempts: found ? found.count : 0
            });
        }

        // 4. Recent Activity
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email createdAt');

        const recentAttempts = await Result.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name')
            .populate('quizId', 'heading');

        // Combine and sort by date
        const recentActivity = [
            ...recentUsers.map(u => ({ type: 'user_register', data: u, date: u.createdAt })),
            ...recentAttempts.map(a => ({ type: 'quiz_attempt', data: a, date: a.createdAt }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        // 5. Top Performers (Global Rank)
        // Assuming globalRank is updated elsewhere, or we can sort by totalSolved/score
        const topPerformers = await User.find()
            .sort({ totalSolved: -1, currentStreak: -1 })
            .limit(5)
            .select('name username email totalSolved currentStreak');

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalQuizzes,
                totalAttempts,
                newUsersLast7Days,
                attemptsLast7Days,
            },
            graphData,
            recentActivity,
            topPerformers
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats'
        });
    }
});

// Get detailed stats for a specific quiz
router.get('/quiz/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId).select('heading');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const results = await Result.find({ quizId })
            .populate('userId', 'name email')
            .sort({ score: -1 });

        const totalAttempts = results.length;

        // Average Score
        const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
        const averageScore = totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(1) : 0;

        // Highest Score
        const highestScore = results.length > 0 ? results[0].score : 0;

        res.json({
            success: true,
            quizName: quiz.heading,
            totalAttempts,
            averageScore,
            highestScore,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz stats'
        });
    }
});

module.exports = router;
