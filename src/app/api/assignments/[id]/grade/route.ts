import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
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

    // Only teachers and admins can grade assignments
    const allowedRoles = [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN]
    if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { submissionId, grade, feedback } = body

    if (!submissionId || grade === undefined || grade === null) {
      return NextResponse.json({ message: 'Submission ID and grade are required' }, { status: 400 })
    }

    // Find the submission
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment')
      .populate('student', 'name email')

    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    // Verify this submission belongs to the assignment
    if (submission.assignment.toString() !== id) {
      return NextResponse.json({ message: 'Invalid submission for this assignment' }, { status: 400 })
    }

    // Get assignment details for validation
    const assignment = await Assignment.findById(id)
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions - only the teacher who created the assignment or admins can grade
    const canGrade = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      assignment.teacher.toString() === session.user.id

    if (!canGrade) {
      return NextResponse.json({ message: 'You can only grade assignments you created' }, { status: 403 })
    }

    // Validate grade is within bounds
    if (grade < 0 || grade > assignment.totalMarks) {
      return NextResponse.json({ 
        message: `Grade must be between 0 and ${assignment.totalMarks}` 
      }, { status: 400 })
    }

    // Apply late penalty if applicable
    let finalGrade = grade
    if (submission.isLate && assignment.latePenaltyPercentage > 0) {
      const penalty = (grade * assignment.latePenaltyPercentage) / 100
      finalGrade = Math.max(0, grade - penalty)
    }

    // Update the submission with grade and feedback
    await submission.markAsGraded(finalGrade, feedback || '', session.user.id)

    // Populate the updated submission for response
    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title totalMarks' },
      { path: 'gradedBy', select: 'name email' }
    ])

    return NextResponse.json({ 
      message: 'Assignment graded successfully',
      data: {
        submission,
        originalGrade: grade,
        finalGrade: finalGrade,
        penaltyApplied: submission.isLate && assignment.latePenaltyPercentage > 0
      }
    })

  } catch (error) {
    console.error('Assignment grading error:', error)
    return NextResponse.json(
      { message: 'Failed to grade assignment', error: (error as Error).message },
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

    // Get assignment details
    const assignment = await Assignment.findById(id)
      .populate('course', 'title')
      .populate('teacher', 'name email')

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions
    const canView = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      assignment.teacher.toString() === session.user.id

    if (!canView) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get all submissions for this assignment with grading details
    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })

    // Calculate grading statistics
    const totalSubmissions = submissions.length
    const gradedSubmissions = submissions.filter(s => s.status === 'graded').length
    const pendingSubmissions = totalSubmissions - gradedSubmissions
    const averageGrade = gradedSubmissions > 0 
      ? submissions
          .filter(s => s.status === 'graded')
          .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions
      : 0

    const lateSubmissions = submissions.filter(s => s.isLate).length

    return NextResponse.json({ 
      data: {
        assignment,
        submissions,
        statistics: {
          totalSubmissions,
          gradedSubmissions,
          pendingSubmissions,
          averageGrade: Math.round(averageGrade * 100) / 100,
          lateSubmissions,
          onTimeSubmissions: totalSubmissions - lateSubmissions
        }
      }
    })

  } catch (error) {
    console.error('Assignment grading info fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch grading information', error: (error as Error).message },
      { status: 500 }
    )
  }
}
