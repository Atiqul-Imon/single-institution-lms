import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import { UserRole } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const course = await Course.findById(id)
      .populate('teacher', 'name email')
      .populate('institution', 'name')
      .populate('students', 'name email')

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // Check permissions
    const canAccess = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      course.teacher._id.toString() === session.user.id ||
      course.students.some((student: { _id: { toString: () => string } }) => student._id.toString() === session.user.id)

    if (!canAccess) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: course })

  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const course = await Course.findById(id)
    
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the course or admins can edit
    const canEdit = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      course.teacher.toString() === session.user.id

    if (!canEdit) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowedUpdates = [
      'title', 'description', 'subject', 'grade', 'academicYear',
      'modules', 'isPaid', 'price', 'prerequisites', 'isPublished'
    ]

    const updates: Record<string, unknown> = {}
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key]
      }
    })

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('teacher', 'name email')
     .populate('institution', 'name')

    return NextResponse.json({
      message: 'Course updated successfully',
      data: updatedCourse
    })

  } catch (error) {
    console.error('Course update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const course = await Course.findById(id)
    
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the course or admins can delete
    const canDelete = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      course.teacher.toString() === session.user.id

    if (!canDelete) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await Course.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Course deleted successfully' })

  } catch (error) {
    console.error('Course deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
