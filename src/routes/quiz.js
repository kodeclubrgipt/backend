const express = require('express');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all active quizzes (public)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .select('heading description questions createdAt isActive')
      .sort({ createdAt: -1 });

    // Remove correct answers from questions for public access
    const publicQuizzes = quizzes.map(quiz => ({
      id: quiz._id.toString(),
      heading: quiz.heading,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        // Don't include correctAnswer
      })),
      createdAt: quiz.createdAt,
      isActive: quiz.isActive,
    }));

    res.json({
      success: true,
      quizzes: publicQuizzes,
      count: publicQuizzes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quizzes',
    });
  }
});

// Get single quiz (public, without answers)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      isActive: true
    }).select('heading description questions createdAt isActive');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Remove correct answers
    const publicQuiz = {
      id: quiz._id.toString(),
      heading: quiz.heading,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
      })),
      createdAt: quiz.createdAt,
      isActive: quiz.isActive,
    };

    res.json({
      success: true,
      quiz: publicQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quiz',
    });
  }
});

// Check if user has already attempted a quiz (Protected route)
router.get('/:id/check-attempt', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const existingAttempt = await Result.findOne({
      userId: req.user._id,
      quizId: quiz._id
    });

    if (existingAttempt) {
      return res.json({
        success: true,
        hasAttempted: true,
        previousResult: {
          score: existingAttempt.score,
          correctAnswers: existingAttempt.correctAnswers,
          totalQuestions: existingAttempt.totalQuestions,
          attemptedAt: existingAttempt.createdAt
        }
      });
    }

    res.json({
      success: true,
      hasAttempted: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check attempt status',
    });
  }
});

// Submit quiz answers and get results (Protected route)
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected answer indices

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required',
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or inactive',
      });
    }

    // Check if user has already attempted this quiz
    const existingAttempt = await Result.findOne({
      userId: req.user._id,
      quizId: quiz._id
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this quiz. Only one attempt is allowed.',
        previousResult: {
          score: existingAttempt.score,
          correctAnswers: existingAttempt.correctAnswers,
          totalQuestions: existingAttempt.totalQuestions,
          attemptedAt: existingAttempt.createdAt
        }
      });
    }

    // Calculate score
    let correctCount = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options,
      };
    });

    const score = (correctCount / quiz.questions.length) * 100;

    // Save result to database
    const result = await Result.create({
      userId: req.user._id,
      quizId: quiz._id,
      score: Math.round(score * 100) / 100,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      wrongAnswers: quiz.questions.length - correctCount,
      answers: results.map(r => ({
        questionIndex: r.questionIndex,
        userAnswer: r.userAnswer,
        isCorrect: r.isCorrect
      }))
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalSolved: 1,
        // Increment streak only if this is the first quiz solved today (logic can be improved)
      }
    });

    console.log(`📝 Quiz Attempt: User "${req.user.name}" (${req.user.email}) submitted quiz "${quiz.heading}". Score: ${Math.round(score)}%`);

    res.json({
      success: true,
      results: {
        id: result._id,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        wrongAnswers: quiz.questions.length - correctCount,
        score: Math.round(score * 100) / 100,
        details: results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit quiz',
    });
  }
});

module.exports = router;
