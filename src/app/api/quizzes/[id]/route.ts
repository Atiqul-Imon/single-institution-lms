import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Quiz from '@/models/Quiz'
import QuizAttempt from '@/models/QuizAttempt'
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
    const quiz = await Quiz.findById(id)
      .populate('course', 'title subject grade students')
      .populate('teacher', 'name email')

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions based on user role
    const course = quiz.course as { students: string[] }
    
    if (session.user.role === UserRole.STUDENT) {
      // Students can only see published quizzes for courses they're enrolled in
      if (!quiz.isPublished || !course.students.includes(session.user.id)) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
      
      // For students, don't reveal correct answers unless quiz allows it
      const quizData = quiz.toObject()
      
      // Check if student has completed the quiz
      const completedAttempt = await QuizAttempt.findOne({
        quiz: id,
        student: session.user.id,
        status: { $in: ['submitted', 'graded'] }
      })
      
      if (!quiz.showAnswers || (!quiz.showAnswersAfterSubmission && !completedAttempt)) {
        // Hide correct answers
        quizData.questions = quizData.questions.map((q: any) => {
          const question = { ...q }
          if (question.options) {
            question.options = question.options.map((opt: any) => ({
              text: opt.text,
              _id: opt._id
            }))
          }
          delete question.correctAnswer
          delete question.explanation
          return question
        })
      }
      
      return NextResponse.json({ data: quizData })
    }

    // Teachers and admins can see full quiz details
    return NextResponse.json({ data: quiz })

  } catch (error) {
    console.error('Quiz fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quiz', error: (error as Error).message },
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
    const quiz = await Quiz.findById(id)
    
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the quiz or admins can edit
    const canEdit = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      quiz.teacher.toString() === session.user.id

    if (!canEdit) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowedUpdates = [
      'title', 'description', 'instructions', 'questions', 'timeLimit',
      'passingPercentage', 'attemptsAllowed', 'showAnswers', 'showAnswersAfterSubmission',
      'randomizeQuestions', 'randomizeOptions', 'isPublished', 'dueDate',
      'availableFrom', 'availableUntil'
    ]

    const updates: Record<string, unknown> = {}
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key]
      }
    })

    // Handle date conversions
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate as string)
    }
    if (updates.availableFrom) {
      updates.availableFrom = new Date(updates.availableFrom as string)
    }
    if (updates.availableUntil) {
      updates.availableUntil = new Date(updates.availableUntil as string)
    }

    // Recalculate total points if questions are updated
    if (updates.questions) {
      const questions = updates.questions as any[]
      updates.totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('course', 'title subject grade')
     .populate('teacher', 'name email')

    if (!updatedQuiz) {
      return NextResponse.json({ message: 'Quiz update failed' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Quiz updated successfully', 
      data: updatedQuiz 
    })

  } catch (error) {
    console.error('Quiz update error:', error)
    return NextResponse.json(
      { message: 'Failed to update quiz', error: (error as Error).message },
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
    const quiz = await Quiz.findById(id)
    
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the quiz or admins can delete
    const canDelete = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      quiz.teacher.toString() === session.user.id

    if (!canDelete) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Also delete all attempts for this quiz
    await QuizAttempt.deleteMany({ quiz: id })
    
    // Delete the quiz
    await Quiz.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Quiz deleted successfully' })

  } catch (error) {
    console.error('Quiz deletion error:', error)
    return NextResponse.json(
      { message: 'Failed to delete quiz', error: (error as Error).message },
      { status: 500 }
    )
  }
}

