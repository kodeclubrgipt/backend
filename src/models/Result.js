const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResultSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        totalQuestions: {
            type: Number,
            required: true,
        },
        correctAnswers: {
            type: Number,
            required: true,
        },
        wrongAnswers: {
            type: Number,
            required: true,
        },
        answers: [
            {
                questionIndex: Number,
                userAnswer: Schema.Types.Mixed, // Index or string depending on question type
                isCorrect: Boolean,
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying of user history and leaderboard
ResultSchema.index({ userId: 1, createdAt: -1 });
ResultSchema.index({ quizId: 1, score: -1 });
// Unique compound index to ensure one attempt per user per quiz
ResultSchema.index({ userId: 1, quizId: 1 }, { unique: true });

module.exports = mongoose.model('Result', ResultSchema);
