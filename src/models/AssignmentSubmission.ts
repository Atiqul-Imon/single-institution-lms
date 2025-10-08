import mongoose, { Schema, Document } from 'mongoose'

export interface AssignmentSubmissionDocument extends Document {
  _id: string
  student: string
  assignment: string
  course: string
  content?: string
  attachments: unknown[]
  submittedAt: Date
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  feedback?: string
  gradedBy?: string
  gradedAt?: Date
  isLate: boolean
  createdAt: Date
  updatedAt: Date
  calculateGrade(): number
  getGradePercentage(): number
  markAsGraded(grade: number, feedback: string, gradedBy: string): Promise<void>
}

const FileAttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true }
}, { _id: false })

const AssignmentSubmissionSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  attachments: [FileAttachmentSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded'],
    default: 'draft'
  },
  grade: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
AssignmentSubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true })
AssignmentSubmissionSchema.index({ assignment: 1 })
AssignmentSubmissionSchema.index({ course: 1 })
AssignmentSubmissionSchema.index({ status: 1 })
AssignmentSubmissionSchema.index({ submittedAt: 1 })

// Pre-save middleware to check if submission is late
AssignmentSubmissionSchema.pre('save', async function(next) {
  if (this.isModified('submittedAt') && this.submittedAt) {
    const Assignment = mongoose.model('Assignment')
    const assignment = await Assignment.findById(this.assignment)
    
    if (assignment) {
      this.isLate = this.submittedAt > assignment.dueDate
    }
  }
  next()
})

// Instance methods
AssignmentSubmissionSchema.methods.calculateGrade = function(): number {
  return this.grade || 0
}

AssignmentSubmissionSchema.methods.getGradePercentage = function(): number {
  if (!this.grade) return 0
  
  const Assignment = mongoose.model('Assignment')
  Assignment.findById(this.assignment).then((assignment: { totalMarks: number } | null) => {
    if (assignment) {
      return (this.grade / assignment.totalMarks) * 100
    }
    return 0
  })
  
  return 0 // Fallback
}


AssignmentSubmissionSchema.methods.markAsGraded = async function(grade: number, feedback: string, gradedBy: string): Promise<void> {
  this.grade = grade
  this.feedback = feedback
  this.gradedBy = gradedBy
  this.gradedAt = new Date()
  this.status = 'graded'
  await this.save()
}

export default mongoose.models.AssignmentSubmission || mongoose.model<AssignmentSubmissionDocument>('AssignmentSubmission', AssignmentSubmissionSchema)
