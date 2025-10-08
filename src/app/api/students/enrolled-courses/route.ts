import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import { UserRole } from '@/lib/constants'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only students can view their enrolled courses
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    // Find courses where the student is enrolled
    const enrolledCourses = await Course.find({
      students: session.user.id,
      isPublished: true
    })
    .populate('teacher', 'name email')
    .populate('institution', 'name')
    .sort({ createdAt: -1 })

    return NextResponse.json({
      data: enrolledCourses
    })

  } catch (error) {
    console.error('Enrolled courses fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
