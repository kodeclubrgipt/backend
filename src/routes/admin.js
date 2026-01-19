const express = require('express');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`🗑️  User Deleted: Admin "${req.user.name}" deleted user "${user.name}" (${user.email})`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
});

// Update user (make admin, update stats, etc.)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, isAdmin, totalSolved, currentStreak, globalRank } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (totalSolved !== undefined) updateData.totalSolved = totalSolved;
    if (currentStreak !== undefined) updateData.currentStreak = currentStreak;
    if (globalRank !== undefined) updateData.globalRank = globalRank;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
});

// Upload quiz from JSON
router.post('/quizzes', async (req, res) => {
  try {
    let { heading, description, questions, quiz } = req.body;

    // Support both "questions" and "quiz" field names
    if (!questions && quiz) {
      questions = quiz;
    }

    // Validate quiz data
    if (!heading || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz data. Heading and questions/quiz array are required.',
      });
    }

    // Process and validate each question
    const processedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question || !q.options || !Array.isArray(q.options)) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} is invalid. Must have question and options array.`,
        });
      }

      if (q.options.length < 2 || q.options.length > 6) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have between 2 and 6 options.`,
        });
      }

      // Handle both formats: correctAnswer (number) or correct_answer (string)
      let correctAnswerIndex;

      if (typeof q.correctAnswer === 'number') {
        // Format: correctAnswer is already an index
        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1} has invalid correctAnswer index.`,
          });
        }
        correctAnswerIndex = q.correctAnswer;
      } else if (q.correct_answer !== undefined) {
        // Format: correct_answer is a string, find its index in options
        const index = q.options.findIndex((opt) => opt === q.correct_answer);
        if (index === -1) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: correct_answer "${q.correct_answer}" not found in options.`,
          });
        }
        correctAnswerIndex = index;
      } else {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have either correctAnswer (number) or correct_answer (string).`,
        });
      }

      // Create processed question with correctAnswer as index
      processedQuestions.push({
        question: q.question,
        options: q.options,
        correctAnswer: correctAnswerIndex,
      });
    }

    // Create quiz
    const createdQuiz = await Quiz.create({
      heading,
      description,
      questions: processedQuestions,
      createdBy: req.user._id,
      isActive: true,
    });

    console.log(`🛠️  Quiz Created: Admin "${req.user.name}" created quiz "${heading}" with ${processedQuestions.length} questions.`);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: createdQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quiz',
    });
  }
});

// Bulk create users
router.post('/users/bulk', async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. An array of users is required.',
      });
    }

    const validUsers = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Basic validation, more robust validation might be needed
        if (!userData.name || !userData.email || !userData.password) {
          errors.push({ user: userData, message: 'Missing required fields (name, email, password)' });
          continue;
        }
        // Hash password before adding to validUsers
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        validUsers.push({ ...userData, password: hashedPassword });
      } catch (validationError) {
        errors.push({ user: userData, message: validationError.message });
      }
    }

    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid users provided for creation.',
        errors: errors,
      });
    }

    // Insert users
    const result = await User.insertMany(validUsers, { ordered: false });

    console.log(`👥 Bulk User Create: Admin "${req.user.name}" added ${result.length} new users.`);

    res.status(201).json({
      success: true,
      message: `Successfully created ${result.length} users`,
      addedCount: result.length,
      errors: errors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create users in bulk',
    });
  }
});

// Get all quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      quizzes,
      count: quizzes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quizzes',
    });
  }
});

// Delete quiz
router.delete('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
    console.log(`🗑️  Quiz Deleted: Admin "${req.user.name}" deleted quiz "${quiz.heading}" (ID: ${quiz._id})`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete quiz',
    });
  }
});

// Toggle quiz active status
router.patch('/quizzes/:id/toggle', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
      quiz,
    });
    console.log(`🔄 Quiz Status: Admin "${req.user.name}" ${quiz.isActive ? 'activated' : 'deactivated'} quiz "${quiz.heading}"`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle quiz status',
    });
  }
});

module.exports = router;
