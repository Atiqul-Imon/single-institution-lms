import mongoose, { Schema, Document } from 'mongoose'

export interface QuizQuestion {
  questionText: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  points: number
  options?: Array<{
    text: string
    isCorrect: boolean
  }>
  correctAnswer?: string
  explanation?: string
}

export interface QuizDocument extends Document {
  _id: string
  title: string
  description: string
  course: string
  teacher: string
  instructions: string
  questions: QuizQuestion[]
  timeLimit: number // in minutes
  totalPoints: number
  passingPercentage: number
  attemptsAllowed: number
  showAnswers: boolean
  showAnswersAfterSubmission: boolean
  randomizeQuestions: boolean
  randomizeOptions: boolean
  isPublished: boolean
  dueDate?: Date
  availableFrom?: Date
  availableUntil?: Date
  createdAt: Date
  updatedAt: Date
  calculateTotalPoints(): number
  isAvailable(): boolean
  hasPassingGrade(score: number): boolean
}

const QuizQuestionSchema = new Schema<QuizQuestion>({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  correctAnswer: {
    type: String
  },
  explanation: {
    type: String
  }
}, { _id: true })

const QuizSchema = new Schema<QuizDocument>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  questions: {
    type: [QuizQuestionSchema],
    required: true,
    validate: {
      validator: function(questions: QuizQuestion[]) {
        return questions && questions.length > 0
      },
      message: 'Quiz must have at least one question'
    }
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
    default: 30 // 30 minutes default
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 1
  },
  passingPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 60
  },
  attemptsAllowed: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  showAnswers: {
    type: Boolean,
    default: true
  },
  showAnswersAfterSubmission: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  availableFrom: {
    type: Date
  },
  availableUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
QuizSchema.index({ course: 1 })
QuizSchema.index({ teacher: 1 })
QuizSchema.index({ isPublished: 1 })
QuizSchema.index({ dueDate: 1 })

// Pre-save middleware to calculate total points
QuizSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    this.totalPoints = this.calculateTotalPoints()
  }
  next()
})

// Instance methods
QuizSchema.methods.calculateTotalPoints = function(): number {
  return this.questions.reduce((total, question) => total + question.points, 0)
}

QuizSchema.methods.isAvailable = function(): boolean {
  const now = new Date()
  
  if (!this.isPublished) return false
  
  if (this.availableFrom && now < this.availableFrom) return false
  if (this.availableUntil && now > this.availableUntil) return false
  if (this.dueDate && now > this.dueDate) return false
  
  return true
}

QuizSchema.methods.hasPassingGrade = function(score: number): boolean {
  const percentage = (score / this.totalPoints) * 100
  return percentage >= this.passingPercentage
}

// Virtual for attempts
QuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz'
})

export default mongoose.models.Quiz || mongoose.model<QuizDocument>('Quiz', QuizSchema)

