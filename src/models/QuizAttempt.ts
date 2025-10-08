import mongoose, { Schema, Document } from 'mongoose'

export interface QuizAnswer {
  questionId: string
  answer: string | string[] // string for single answer, array for multiple choice
  isCorrect?: boolean
  pointsEarned?: number
}

export interface QuizAttemptDocument extends Document {
  _id: string
  student: string
  quiz: string
  course: string
  answers: QuizAnswer[]
  score: number
  percentage: number
  passed: boolean
  status: 'in-progress' | 'submitted' | 'graded'
  attemptNumber: number
  startedAt: Date
  submittedAt?: Date
  timeSpent?: number // in seconds
  gradedBy?: string
  gradedAt?: Date
  feedback?: string
  createdAt: Date
  updatedAt: Date
  calculateScore(quiz: any): void
  isComplete(): boolean
}

const QuizAnswerSchema = new Schema<QuizAnswer>({
  questionId: {
    type: String,
    required: true
  },
  answer: {
    type: Schema.Types.Mixed, // Can be string or array
    required: true
  },
  isCorrect: {
    type: Boolean
  },
  pointsEarned: {
    type: Number,
    min: 0,
    default: 0
  }
}, { _id: false })

const QuizAttemptSchema = new Schema<QuizAttemptDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  answers: {
    type: [QuizAnswerSchema],
    required: true,
    default: []
  },
  score: {
    type: Number,
    min: 0,
    default: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded'],
    default: 'in-progress'
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    min: 0
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
QuizAttemptSchema.index({ student: 1, quiz: 1 })
QuizAttemptSchema.index({ quiz: 1 })
QuizAttemptSchema.index({ course: 1 })
QuizAttemptSchema.index({ status: 1 })
QuizAttemptSchema.index({ submittedAt: 1 })

// Instance methods
QuizAttemptSchema.methods.calculateScore = function(quiz: any): void {
  let totalScore = 0
  
  this.answers.forEach((answer: QuizAnswer) => {
    const question = quiz.questions.id(answer.questionId)
    
    if (!question) return
    
    // Auto-grade objective questions
    if (question.type === 'multiple-choice') {
      const correctOptions = question.options
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.text)
      
      const studentAnswers = Array.isArray(answer.answer) ? answer.answer : [answer.answer]
      const isCorrect = correctOptions.every((opt: string) => studentAnswers.includes(opt)) &&
                       studentAnswers.every((ans: string) => correctOptions.includes(ans))
      
      answer.isCorrect = isCorrect
      answer.pointsEarned = isCorrect ? question.points : 0
      totalScore += answer.pointsEarned
    } else if (question.type === 'true-false') {
      const correctOption = question.options.find((opt: any) => opt.isCorrect)
      const isCorrect = correctOption && answer.answer === correctOption.text
      
      answer.isCorrect = isCorrect
      answer.pointsEarned = isCorrect ? question.points : 0
      totalScore += answer.pointsEarned
    }
    // Short answer questions need manual grading, so skip auto-grading
  })
  
  this.score = totalScore
  this.percentage = quiz.totalPoints > 0 ? (totalScore / quiz.totalPoints) * 100 : 0
  this.passed = quiz.hasPassingGrade(totalScore)
}

QuizAttemptSchema.methods.isComplete = function(): boolean {
  return this.status === 'submitted' || this.status === 'graded'
}

// Pre-save middleware to calculate time spent
QuizAttemptSchema.pre('save', function(next) {
  if (this.isModified('submittedAt') && this.submittedAt && this.startedAt) {
    this.timeSpent = Math.floor((this.submittedAt.getTime() - this.startedAt.getTime()) / 1000)
  }
  next()
})

export default mongoose.models.QuizAttempt || mongoose.model<QuizAttemptDocument>('QuizAttempt', QuizAttemptSchema)

