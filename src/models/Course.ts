import mongoose, { Schema, Document } from 'mongoose'
import { CourseStatus } from '@/lib/constants'
import { Course as ICourse, Module, Lesson, LessonContent } from '@/types'

export interface CourseDocument extends Omit<ICourse, '_id'>, Document {
  isPublished(): boolean
  isDraft(): boolean
  isArchived(): boolean
  canEnroll(): boolean
  getTotalDuration(): number
  getModuleCount(): number
  getLessonCount(): number
}

const LessonContentSchema = new Schema<LessonContent>({
  type: {
    type: String,
    enum: ['video', 'document', 'image', 'audio', 'text'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  duration: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: false })

const LessonSchema = new Schema<Lesson>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: [LessonContentSchema],
  duration: {
    type: Number,
    required: true,
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

const ModuleSchema = new Schema<Module>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [LessonSchema],
  assignments: [{
    type: String,
    ref: 'Assignment'
  }],
  quiz: {
    type: String,
    ref: 'Quiz'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

const CourseSchema = new Schema<CourseDocument>({
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
  institution: {
    type: String,
    ref: 'Institution',
    required: true
  },
  teacher: {
    type: String,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    enum: ['first', 'second'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  modules: [ModuleSchema],
  prerequisites: [{
    type: String,
    ref: 'Course'
  }],
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BDT', 'USD'],
    default: 'BDT'
  },
  enrollmentLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(CourseStatus),
    default: CourseStatus.DRAFT
  },
  thumbnail: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
CourseSchema.index({ title: 1 })
CourseSchema.index({ institution: 1 })
CourseSchema.index({ teacher: 1 })
CourseSchema.index({ subject: 1 })
CourseSchema.index({ class: 1 })
CourseSchema.index({ semester: 1 })
CourseSchema.index({ academicYear: 1 })
CourseSchema.index({ status: 1 })
CourseSchema.index({ isPaid: 1 })
CourseSchema.index({ startDate: 1, endDate: 1 })

// Virtual for enrollment count
CourseSchema.virtual('enrollmentCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  count: true
})

// Virtual for total duration
CourseSchema.virtual('totalDuration').get(function() {
  return this.modules.reduce((total, module) => {
    return total + module.lessons.reduce((moduleTotal, lesson) => {
      return moduleTotal + lesson.duration
    }, 0)
  }, 0)
})

// Virtual for total lessons
CourseSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((total, module) => {
    return total + module.lessons.length
  }, 0)
})

// Virtual for total modules
CourseSchema.virtual('totalModules').get(function() {
  return this.modules.length
})

// Instance methods
CourseSchema.methods.isPublished = function(): boolean {
  return this.status === CourseStatus.PUBLISHED
}

CourseSchema.methods.isDraft = function(): boolean {
  return this.status === CourseStatus.DRAFT
}

CourseSchema.methods.isArchived = function(): boolean {
  return this.status === CourseStatus.ARCHIVED
}

CourseSchema.methods.canEnroll = function(): boolean {
  if (!this.isPublished()) return false
  if (this.enrollmentLimit === 0) return true
  return (this.enrollmentCount as number) < this.enrollmentLimit
}

CourseSchema.methods.getTotalDuration = function(): number {
  return this.totalDuration
}

CourseSchema.methods.getModuleCount = function(): number {
  return this.modules.length
}

CourseSchema.methods.getLessonCount = function(): number {
  return this.totalLessons
}

// Static methods
CourseSchema.statics.findPublished = function() {
  return this.find({ status: CourseStatus.PUBLISHED })
}

CourseSchema.statics.findByInstitution = function(institutionId: string) {
  return this.find({ institution: institutionId })
}

CourseSchema.statics.findByTeacher = function(teacherId: string) {
  return this.find({ teacher: teacherId })
}

CourseSchema.statics.findBySubject = function(subject: string) {
  return this.find({ subject: new RegExp(subject, 'i') })
}

CourseSchema.statics.findPaid = function() {
  return this.find({ isPaid: true })
}

CourseSchema.statics.findFree = function() {
  return this.find({ isPaid: false })
}

// Pre-save middleware
CourseSchema.pre('save', function(next) {
  if (this.isModified('endDate') && this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'))
  }
  next()
})

export default mongoose.models.Course || mongoose.model<CourseDocument>('Course', CourseSchema)
