import mongoose, { Schema, Document } from 'mongoose'
import { InstitutionType, BoardType, GradingSystem } from '@/lib/constants'
import { Institution as IInstitution, InstitutionSettings } from '@/types'

export interface InstitutionDocument extends Omit<IInstitution, '_id'>, Document {
  updateSettings(settings: Partial<InstitutionSettings>): Promise<void>
}

const InstitutionSettingsSchema = new Schema<InstitutionSettings>({
  academicYear: { type: String, required: true, default: '2024-2025' },
  semester: { 
    type: String, 
    enum: ['first', 'second'], 
    required: true, 
    default: 'first' 
  },
  board: { 
    type: String, 
    enum: Object.values(BoardType), 
    required: true,
    default: BoardType.OTHER
  },
  gradingSystem: { 
    type: String, 
    enum: Object.values(GradingSystem), 
    required: true,
    default: GradingSystem.LETTER
  },
  currency: { 
    type: String, 
    enum: ['BDT', 'USD'], 
    required: true,
    default: 'BDT'
  },
  timezone: { 
    type: String, 
    required: true,
    default: 'Asia/Dhaka'
  },
  features: {
    liveClasses: { type: Boolean, default: true },
    assignments: { type: Boolean, default: true },
    quizzes: { type: Boolean, default: true },
    forums: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
    parentPortal: { type: Boolean, default: false }
  }
}, { _id: false })

const InstitutionSchema = new Schema<InstitutionDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(InstitutionType),
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    type: InstitutionSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
InstitutionSchema.index({ name: 1 })
InstitutionSchema.index({ type: 1 })
InstitutionSchema.index({ email: 1 })
InstitutionSchema.index({ isActive: 1 })

// Instance methods

InstitutionSchema.methods.updateSettings = async function(settings: Partial<InstitutionSettings>): Promise<void> {
  this.settings = { ...this.settings, ...settings }
  await this.save()
}

// Static methods
InstitutionSchema.statics.findActive = function() {
  return this.find({ isActive: true })
}

InstitutionSchema.statics.findByType = function(type: InstitutionType) {
  return this.find({ type, isActive: true })
}

InstitutionSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() })
}

// Pre-save middleware
InstitutionSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim()
  }
  next()
})

export default mongoose.models.Institution || mongoose.model<InstitutionDocument>('Institution', InstitutionSchema)
