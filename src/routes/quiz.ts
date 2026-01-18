import express, { Request, Response } from 'express';
import Quiz from '../models/Quiz';

const router = express.Router();

// Get all active quizzes (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .select('heading description questions createdAt')
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quizzes',
    });
  }
});

// Get single quiz (public, without answers)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quiz = await Quiz.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).select('heading description questions createdAt');

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quiz',
    });
  }
});

// Submit quiz answers and get results
router.post('/:id/submit', async (req: Request, res: Response) => {
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
        message: 'Quiz not found',
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

    res.json({
      success: true,
      results: {
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        wrongAnswers: quiz.questions.length - correctCount,
        score: Math.round(score * 100) / 100,
        details: results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit quiz',
    });
  }
});

export default router;
