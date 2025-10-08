import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import { UserRole } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only students can enroll in courses
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if course exists and is published
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json({ message: 'Course is not available for enrollment' }, { status: 400 })
    }

    // Check if student is already enrolled
    if (course.students.includes(session.user.id)) {
      return NextResponse.json({ message: 'Already enrolled in this course' }, { status: 400 })
    }

    // For paid courses, you would typically handle payment here
    // For now, we'll just allow enrollment
    if (course.isPaid) {
      // In a real application, you would:
      // 1. Verify payment
      // 2. Process payment with payment gateway
      // 3. Create payment record
      console.log(`Student ${session.user.id} enrolling in paid course ${courseId} for ${course.price} BDT`)
    }

    // Add student to course
    course.students.push(session.user.id)
    await course.save()

    return NextResponse.json({
      message: 'Successfully enrolled in course',
      data: {
        courseId: course._id,
        courseTitle: course.title,
        enrollmentDate: new Date()
      }
    })

  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
