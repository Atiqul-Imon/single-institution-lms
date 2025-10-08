import mongoose, { Schema, Document } from 'mongoose'
import { UserRole, UserPermissions, RolePermissions } from '@/lib/constants'
import { User as IUser, UserProfile, UserPreferences } from '@/types'

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  hasPermission(permission: UserPermissions): boolean
  getFullName(): string
}

export interface UserModel extends mongoose.Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>
  findByInstitution(institutionId: string): Promise<UserDocument[]>
  findByRole(role: UserRole): Promise<UserDocument[]>
  findActiveUsers(): Promise<UserDocument[]>
}

const UserPreferencesSchema = new Schema<UserPreferences>({
  language: { type: String, enum: ['en', 'bn'], default: 'en' },
  timezone: { type: String, default: 'Asia/Dhaka' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
}, { _id: false })

const UserProfileSchema = new Schema<UserProfile>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  avatar: { type: String },
  bio: { type: String },
  preferences: { type: UserPreferencesSchema, default: () => ({}) }
}, { _id: false })

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.STUDENT
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    type: UserProfileSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
// Note: email index is created automatically by unique: true
UserSchema.index({ institution: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`
  }
  return this.name
})

// Instance methods
UserSchema.methods.hasPermission = function(permission: UserPermissions): boolean {
  const userPermissions = RolePermissions[this.role as UserRole] || []
  return userPermissions.includes(permission)
}


UserSchema.methods.getFullName = function(): string {
  return this.fullName
}

// Pre-save middleware
UserSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim()
  }
  next()
})

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() })
}

UserSchema.statics.findByInstitution = function(institutionId: string) {
  return this.find({ institution: institutionId })
}

UserSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role, isActive: true })
}

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true })
}

export default (mongoose.models.User as UserModel) || mongoose.model<UserDocument, UserModel>('User', UserSchema)
