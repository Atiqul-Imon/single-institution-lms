import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No authorization token provided' },
        { status: 401 }
      )
    }

    // const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // TODO: Verify JWT token and get user ID
    // For now, we'll simulate getting user from token
    // In a real implementation, you'd decode the JWT and get the user ID
    
    // For development purposes, let's get the first user
    const user = await User.findOne().populate('institution')
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data without sensitive information
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
      isActive: user.isActive,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: userData
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
