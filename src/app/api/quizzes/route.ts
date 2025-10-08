import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Quiz from '@/models/Quiz'
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
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: Record<string, unknown> = {}

    // Filter based on user role
    if (session.user.role === UserRole.TEACHER) {
      query.teacher = session.user.id
    } else if (session.user.role === UserRole.STUDENT) {
      // Students can only see published quizzes for courses they're enrolled in
      query.isPublished = true
      
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
      // Institution admins can see all quizzes in their institution
      const courses = await Course.find({ institution: session.user.institution })
      const courseIds = courses.map(course => course._id)
      query.course = { $in: courseIds }
    }

    if (teacherId && session.user.role !== UserRole.STUDENT) {
      query.teacher = teacherId
    }

    if (courseId && session.user.role !== UserRole.STUDENT) {
      query.course = courseId
    }

    const quizzes = await Quiz.find(query)
      .populate('course', 'title subject grade')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalQuizzes = await Quiz.countDocuments(query)

    return NextResponse.json({
      data: quizzes,
      pagination: {
        total: totalQuizzes,
        page,
        limit,
        totalPages: Math.ceil(totalQuizzes / limit),
      },
    })

  } catch (error) {
    console.error('Quiz fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quizzes', error: (error as Error).message },
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

    // Only teachers and admins can create quizzes
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
      instructions,
      questions,
      timeLimit,
      passingPercentage,
      attemptsAllowed,
      showAnswers,
      showAnswersAfterSubmission,
      randomizeQuestions,
      randomizeOptions,
      isPublished,
      dueDate,
      availableFrom,
      availableUntil
    } = body

    // Basic validation
    if (!title || !description || !course || !instructions || !questions || questions.length === 0) {
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
      return NextResponse.json({ message: 'You can only create quizzes for your own courses' }, { status: 403 })
    }

    // Calculate total points
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)

    const newQuiz = new Quiz({
      title,
      description,
      course,
      teacher: session.user.id,
      instructions,
      questions,
      timeLimit: timeLimit || 30,
      totalPoints,
      passingPercentage: passingPercentage || 60,
      attemptsAllowed: attemptsAllowed || 1,
      showAnswers: showAnswers !== false,
      showAnswersAfterSubmission: showAnswersAfterSubmission !== false,
      randomizeQuestions: randomizeQuestions || false,
      randomizeOptions: randomizeOptions || false,
      isPublished: isPublished || false,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableUntil: availableUntil ? new Date(availableUntil) : undefined
    })

    await newQuiz.save()

    // Populate the response
    await newQuiz.populate([
      { path: 'course', select: 'title subject grade' },
      { path: 'teacher', select: 'name email' }
    ])

    return NextResponse.json({ 
      message: 'Quiz created successfully', 
      data: newQuiz 
    }, { status: 201 })

  } catch (error) {
    console.error('Quiz creation error:', error)
    return NextResponse.json(
      { message: 'Failed to create quiz', error: (error as Error).message },
      { status: 500 }
    )
  }
}

