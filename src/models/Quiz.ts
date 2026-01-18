import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-based)
}

export interface IQuiz extends Document {
  heading: string;
  description?: string;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const QuestionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length >= 2 && v.length <= 6; // At least 2 options, max 6
      },
      message: 'Each question must have between 2 and 6 options',
    },
  },
  correctAnswer: {
    type: Number,
    required: true,
    validate: {
      validator: function(this: IQuestion, v: number) {
        return v >= 0 && v < this.options.length;
      },
      message: 'Correct answer index must be within options range',
    },
  },
});

const QuizSchema = new Schema<IQuiz>(
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
        validator: function(v: IQuestion[]) {
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

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
