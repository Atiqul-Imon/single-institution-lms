import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Assignment from '@/models/Assignment'
import Course from '@/models/Course'
import { UserRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')
    const teacherId = searchParams.get('teacherId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const query: Record<string, unknown> = { isPublished: true }

    // Filter based on user role and permissions
    if (session.user.role === UserRole.TEACHER) {
      // Teachers can see their own assignments
      query.teacher = session.user.id
    } else if (session.user.role === UserRole.STUDENT) {
      // Students can only see assignments for courses they're enrolled in
      if (courseId) {
        const course = await Course.findById(courseId)
        if (course && course.students.includes(session.user.id)) {
          query.course = courseId
        } else {
          return NextResponse.json({ message: 'Access denied to this course' }, { status: 403 })
        }
      } else {
        // Get all courses the student is enrolled in
        const enrolledCourses = await Course.find({ students: session.user.id })
        const courseIds = enrolledCourses.map(course => course._id)
        query.course = { $in: courseIds }
      }
    } else if (session.user.role === UserRole.INSTITUTION_ADMIN) {
      // Institution admins can see all assignments in their institution
      const courses = await Course.find({ institution: session.user.institution })
      const courseIds = courses.map(course => course._id)
      query.course = { $in: courseIds }
    }

    if (teacherId) {
      query.teacher = teacherId
    }

    const assignments = await Assignment.find(query)
      .populate('course', 'title subject grade')
      .populate('module', 'title')
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalAssignments = await Assignment.countDocuments(query)

    return NextResponse.json({
      data: assignments,
      pagination: {
        total: totalAssignments,
        page,
        limit,
        totalPages: Math.ceil(totalAssignments / limit),
      },
    })

  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch assignments', error: (error as Error).message },
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

    // Only teachers and admins can create assignments
    const allowedRoles = [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN]
    if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      title,
      description,
      course,
      module,
      type,
      instructions,
      dueDate,
      totalMarks,
      weight,
      submissionType,
      lateSubmissionAllowed,
      latePenaltyPercentage,
      plagiarismCheck,
      rubric,
      attachments
    } = body

    // Basic validation
    if (!title || !description || !course || !instructions || !dueDate || !totalMarks) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Verify course exists and user has access
    const courseDoc = await Course.findById(course)
    if (!courseDoc) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // Check if user is the teacher of this course or admin
    const canCreate = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      courseDoc.teacher.toString() === session.user.id

    if (!canCreate) {
      return NextResponse.json({ message: 'You can only create assignments for your own courses' }, { status: 403 })
    }

    const newAssignment = new Assignment({
      title,
      description,
      course,
      module,
      type: type || 'homework',
      instructions,
      dueDate: new Date(dueDate),
      totalMarks,
      weight: weight || 10,
      submissionType: submissionType || 'both',
      lateSubmissionAllowed: lateSubmissionAllowed !== false,
      latePenaltyPercentage: latePenaltyPercentage || 10,
      plagiarismCheck: plagiarismCheck || false,
      rubric: rubric || [],
      attachments: attachments || [],
      teacher: session.user.id
    })

    await newAssignment.save()

    // Populate the response
    await newAssignment.populate([
      { path: 'course', select: 'title subject grade' },
      { path: 'module', select: 'title' },
      { path: 'teacher', select: 'name email' }
    ])

    return NextResponse.json({ 
      message: 'Assignment created successfully', 
      data: newAssignment 
    }, { status: 201 })

  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { message: 'Failed to create assignment', error: (error as Error).message },
      { status: 500 }
    )
  }
}
