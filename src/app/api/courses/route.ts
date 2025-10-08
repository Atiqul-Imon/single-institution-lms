import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import { UserRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const institutionId = searchParams.get('institutionId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const query: Record<string, unknown> = { isPublished: true }

    // Filter based on user role and permissions
    if (session.user.role === UserRole.TEACHER) {
      query.teacher = session.user.id
    } else if (session.user.role === UserRole.INSTITUTION_ADMIN) {
      query.institution = session.user.institution
    } else if (session.user.role === UserRole.STUDENT) {
      // Students can only see enrolled courses
      query.students = { $in: [session.user.id] }
    }

    // Additional filters
    if (teacherId) {
      query.teacher = teacherId
    }
    if (institutionId) {
      query.institution = institutionId
    }

    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('teacher', 'name email')
        .populate('institution', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query)
    ])

    return NextResponse.json({
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can create courses
    const allowedRoles = [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN]
    if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      subject,
      grade,
      academicYear,
      modules,
      isPaid,
      price,
      prerequisites
    } = body

    // Validation
    if (!title || !description || !subject) {
      return NextResponse.json(
        { message: 'Title, description, and subject are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const course = new Course({
      title,
      description,
      teacher: session.user.id,
      institution: session.user.institution,
      subject,
      grade,
      academicYear: academicYear || new Date().getFullYear().toString(),
      modules: modules || [],
      isPaid: isPaid || false,
      price: isPaid ? price : 0,
      prerequisites: prerequisites || [],
      isPublished: false // Courses start as drafts
    })

    await course.save()

    // Populate the response
    await course.populate('teacher', 'name email')
    await course.populate('institution', 'name')

    return NextResponse.json(
      { 
        message: 'Course created successfully',
        data: course 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
