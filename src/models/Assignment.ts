import mongoose, { Schema, Document } from 'mongoose'
import { Assignment as IAssignment, FileAttachment } from '@/types'

export interface AssignmentDocument extends Omit<IAssignment, '_id'>, Document {
  getSubmissions(): Promise<AssignmentSubmissionDocument[]>
  getSubmissionByStudent(studentId: string): Promise<AssignmentSubmissionDocument | null>
  isDueDatePassed(): boolean
  canSubmitLate(): boolean
}

export interface AssignmentSubmissionDocument extends Document {
  _id: string
  student: string
  assignment: string
  course: string
  content: string
  attachments: FileAttachment[]
  submittedAt: Date
  status: 'draft' | 'submitted' | 'graded'
  grade?: number
  feedback?: string
  gradedBy?: string
  gradedAt?: Date
  isLate: boolean
  createdAt: Date
  updatedAt: Date
}

const RubricLevelSchema = new Schema({
  level: { type: String, required: true },
  description: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false })

const RubricSchema = new Schema({
  criteria: { type: String, required: true },
  description: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 },
  levels: [RubricLevelSchema]
}, { _id: false })

const FileAttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true }
}, { _id: false })

const AssignmentSchema = new Schema({
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
  module: {
    type: Schema.Types.ObjectId,
    ref: 'Module'
  },
  type: {
    type: String,
    enum: ['homework', 'project', 'presentation', 'essay'],
    default: 'homework'
  },
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [FileAttachmentSchema],
  dueDate: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  submissionType: {
    type: String,
    enum: ['file', 'text', 'both'],
    default: 'both'
  },
  lateSubmissionAllowed: {
    type: Boolean,
    default: true
  },
  latePenaltyPercentage: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  plagiarismCheck: {
    type: Boolean,
    default: false
  },
  rubric: [RubricSchema],
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
AssignmentSchema.index({ course: 1 })
AssignmentSchema.index({ module: 1 })
AssignmentSchema.index({ dueDate: 1 })
AssignmentSchema.index({ isPublished: 1 })

// Virtual for submissions
AssignmentSchema.virtual('submissions', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment'
})

// Instance methods
AssignmentSchema.methods.getSubmissions = async function(): Promise<AssignmentSubmissionDocument[]> {
  await this.populate('submissions')
  return this.submissions
}

AssignmentSchema.methods.getSubmissionByStudent = async function(studentId: string): Promise<AssignmentSubmissionDocument | null> {
  const AssignmentSubmission = mongoose.model('AssignmentSubmission')
  return await AssignmentSubmission.findOne({
    assignment: this._id,
    student: studentId
  })
}

AssignmentSchema.methods.isDueDatePassed = function(): boolean {
  return new Date() > this.dueDate
}

AssignmentSchema.methods.canSubmitLate = function(): boolean {
  return this.lateSubmissionAllowed && this.isDueDatePassed()
}

export default mongoose.models.Assignment || mongoose.model<AssignmentDocument>('Assignment', AssignmentSchema)
