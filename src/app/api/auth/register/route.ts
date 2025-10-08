import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, role, phone, institution } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userData: {
      email: string
      name: string
      password: string
      role: string
      institution?: string | null
      profile: {
        firstName: string
        lastName: string
        phone?: string
        preferences: {
          language: string
          timezone: string
          notifications: {
            email: boolean
            sms: boolean
            push: boolean
          }
        }
      }
      isActive: boolean
    } = {
      email: email.toLowerCase(),
      name: `${firstName} ${lastName}`,
      password: hashedPassword,
      role: role || UserRole.STUDENT,
      profile: {
        firstName,
        lastName,
        phone,
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      },
      isActive: true
    }

    // Only add institution if provided
    if (institution && institution.trim() !== '') {
      userData.institution = institution
    }

    const user = new User(userData)

    await user.save()

    // Return success (don't include password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Provide more detailed error messages
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        message: 'Registration failed',
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
