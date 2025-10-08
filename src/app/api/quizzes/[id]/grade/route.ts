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

    // Only teachers and admins can grade quizzes
    const allowedRoles = [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN]
    if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { attemptId, manualGrades, feedback } = body

    if (!attemptId) {
      return NextResponse.json({ message: 'Attempt ID is required' }, { status: 400 })
    }

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quiz')

    if (!attempt) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 })
    }

    // Verify this attempt belongs to the quiz
    if (attempt.quiz._id.toString() !== id) {
      return NextResponse.json({ message: 'Invalid attempt for this quiz' }, { status: 400 })
    }

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions - only the teacher who created the quiz or admins can grade
    const canGrade = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      quiz.teacher.toString() === session.user.id

    if (!canGrade) {
      return NextResponse.json({ message: 'You can only grade quizzes you created' }, { status: 403 })
    }

    // Apply manual grades for short-answer questions
    if (manualGrades && Array.isArray(manualGrades)) {
      manualGrades.forEach((grade: { questionId: string; points: number }) => {
        const answer = attempt.answers.find(a => a.questionId === grade.questionId)
        if (answer) {
          const question = quiz.questions.id(grade.questionId)
          if (question && question.type === 'short-answer') {
            answer.pointsEarned = Math.min(grade.points, question.points)
            answer.isCorrect = grade.points > 0
          }
        }
      })
    }

    // Recalculate total score
    attempt.score = attempt.answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0)
    attempt.percentage = quiz.totalPoints > 0 ? (attempt.score / quiz.totalPoints) * 100 : 0
    attempt.passed = quiz.hasPassingGrade(attempt.score)
    attempt.status = 'graded'
    attempt.gradedBy = session.user.id
    attempt.gradedAt = new Date()
    
    if (feedback) {
      attempt.feedback = feedback
    }

    await attempt.save()

    // Populate the response
    await attempt.populate([
      { path: 'student', select: 'name email' },
      { path: 'quiz', select: 'title totalPoints passingPercentage' },
      { path: 'gradedBy', select: 'name email' }
    ])

    return NextResponse.json({ 
      message: 'Quiz graded successfully',
      data: attempt
    })

  } catch (error) {
    console.error('Quiz grading error:', error)
    return NextResponse.json(
      { message: 'Failed to grade quiz', error: (error as Error).message },
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

    // Only teachers and admins can view grading information
    const allowedRoles = [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN]
    if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { id } = await params

    // Get quiz details
    const quiz = await Quiz.findById(id)
      .populate('course', 'title')
      .populate('teacher', 'name email')

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions
    const canView = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      quiz.teacher.toString() === session.user.id

    if (!canView) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ quiz: id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })

    // Calculate grading statistics
    const totalAttempts = attempts.length
    const gradedAttempts = attempts.filter(a => a.status === 'graded').length
    const pendingAttempts = attempts.filter(a => a.status === 'submitted').length
    const averageScore = attempts.length > 0 
      ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
      : 0
    const passedCount = attempts.filter(a => a.passed).length
    const failedCount = attempts.filter(a => !a.passed && a.status !== 'in-progress').length

    return NextResponse.json({ 
      data: {
        quiz,
        attempts,
        statistics: {
          totalAttempts,
          gradedAttempts,
          pendingAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          passedCount,
          failedCount,
          passRate: totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0
        }
      }
    })

  } catch (error) {
    console.error('Quiz grading info fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch grading information', error: (error as Error).message },
      { status: 500 }
    )
  }
}

