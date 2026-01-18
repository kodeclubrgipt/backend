const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2 && v.length <= 6; // At least 2 options, max 6
      },
      message: 'Each question must have between 2 and 6 options',
    },
  },
  correctAnswer: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v >= 0 && v < this.options.length;
      },
      message: 'Correct answer index must be within options range',
    },
  },
});

const QuizSchema = new Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questions: {
      type: [QuestionSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v.length > 0;
        },
        message: 'Quiz must have at least one question',
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', QuizSchema);
