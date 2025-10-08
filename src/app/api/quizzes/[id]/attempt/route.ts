import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Quiz from '@/models/Quiz'
import QuizAttempt from '@/models/QuizAttempt'
import { UserRole } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only students can submit quiz attempts
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ message: 'Only students can submit quiz attempts' }, { status: 403 })
    }

    await connectDB()

    const { id } = await params
    const quiz = await Quiz.findById(id).populate('course', 'students')

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check if quiz is published and available
    if (!quiz.isPublished) {
      return NextResponse.json({ message: 'Quiz is not available' }, { status: 400 })
    }

    if (!quiz.isAvailable()) {
      return NextResponse.json({ message: 'Quiz is not currently available' }, { status: 400 })
    }

    // Check if student is enrolled in the course
    const course = quiz.course as { students: string[] }
    if (!course.students.includes(session.user.id)) {
      return NextResponse.json({ message: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Check number of attempts
    const previousAttempts = await QuizAttempt.countDocuments({
      quiz: id,
      student: session.user.id,
      status: { $in: ['submitted', 'graded'] }
    })

    if (previousAttempts >= quiz.attemptsAllowed) {
      return NextResponse.json({ message: 'Maximum number of attempts reached' }, { status: 400 })
    }

    const body = await request.json()
    const { answers, status = 'submitted', startedAt } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ message: 'Invalid answers format' }, { status: 400 })
    }

    // Create or update attempt
    const attemptNumber = previousAttempts + 1

    const attempt = new QuizAttempt({
      student: session.user.id,
      quiz: id,
      course: quiz.course,
      answers,
      status,
      attemptNumber,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      submittedAt: status === 'submitted' ? new Date() : undefined
    })

    // Auto-grade objective questions
    if (status === 'submitted') {
      attempt.calculateScore(quiz)
      
      // Check if all questions are auto-gradable
      const hasShortAnswer = quiz.questions.some(q => q.type === 'short-answer')
      if (!hasShortAnswer) {
        attempt.status = 'graded'
        attempt.gradedAt = new Date()
      }
    }

    await attempt.save()

    // Populate the response
    await attempt.populate([
      { path: 'student', select: 'name email' },
      { path: 'quiz', select: 'title totalPoints passingPercentage' }
    ])

    return NextResponse.json({ 
      message: status === 'submitted' ? 'Quiz submitted successfully' : 'Progress saved',
      data: attempt 
    }, { status: 201 })

  } catch (error) {
    console.error('Quiz attempt error:', error)
    return NextResponse.json(
      { message: 'Failed to submit quiz', error: (error as Error).message },
      { status: 500 }
    )
  }
}

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

    if (session.user.role === UserRole.STUDENT) {
      // Students can only see their own attempts
      const attempts = await QuizAttempt.find({
        quiz: id,
        student: session.user.id
      })
      .populate('quiz', 'title totalPoints passingPercentage showAnswers showAnswersAfterSubmission')
      .sort({ attemptNumber: -1 })

      return NextResponse.json({ data: attempts })
    } else {
      // Teachers and admins can see all attempts for the quiz
      const attempts = await QuizAttempt.find({ quiz: id })
        .populate('student', 'name email')
        .populate('quiz', 'title totalPoints passingPercentage')
        .sort({ submittedAt: -1 })

      // Calculate statistics
      const statistics = {
        totalAttempts: attempts.length,
        averageScore: attempts.length > 0 
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
          : 0,
        passedCount: attempts.filter(a => a.passed).length,
        failedCount: attempts.filter(a => !a.passed).length,
        averageTimeSpent: attempts.length > 0
          ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length
          : 0
      }

      return NextResponse.json({ 
        data: attempts,
        statistics 
      })
    }

  } catch (error) {
    console.error('Quiz attempts fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch attempts', error: (error as Error).message },
      { status: 500 }
    )
  }
}

