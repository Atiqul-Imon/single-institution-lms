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

    // Only students can submit assignments
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ message: 'Only students can submit assignments' }, { status: 403 })
    }

    await connectDB()

    const { id } = await params
    const assignment = await Assignment.findById(id)
      .populate('course', 'students')

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check if assignment is published
    if (!assignment.isPublished) {
      return NextResponse.json({ message: 'Assignment is not available for submission' }, { status: 400 })
    }

    // Check if student is enrolled in the course
    const course = assignment.course as { students: string[] }
    if (!course.students.includes(session.user.id)) {
      return NextResponse.json({ message: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Check if assignment is past due date and late submission is not allowed
    const now = new Date()
    if (now > assignment.dueDate && !assignment.lateSubmissionAllowed) {
      return NextResponse.json({ message: 'Assignment submission deadline has passed' }, { status: 400 })
    }

    const body = await request.json()
    const { content, attachments, status = 'submitted' } = body

    // Validate submission based on assignment requirements
    if (assignment.submissionType === 'file' && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ message: 'File submission is required for this assignment' }, { status: 400 })
    }

    if (assignment.submissionType === 'text' && (!content || content.trim().length === 0)) {
      return NextResponse.json({ message: 'Text content is required for this assignment' }, { status: 400 })
    }

    // Check if student already has a submission
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: id,
      student: session.user.id
    })

    let submission

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.content = content || existingSubmission.content
      existingSubmission.attachments = attachments || existingSubmission.attachments
      existingSubmission.status = status
      
      if (status === 'submitted') {
        existingSubmission.submittedAt = new Date()
      }
      
      submission = await existingSubmission.save()
    } else {
      // Create new submission
      submission = new AssignmentSubmission({
        student: session.user.id,
        assignment: id,
        course: assignment.course,
        content,
        attachments: attachments || [],
        status,
        submittedAt: status === 'submitted' ? new Date() : undefined
      })

      await submission.save()
    }

    // Populate the response
    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title totalMarks dueDate' }
    ])

    return NextResponse.json({ 
      message: status === 'submitted' ? 'Assignment submitted successfully' : 'Draft saved successfully',
      data: submission 
    }, { status: 201 })

  } catch (error) {
    console.error('Assignment submission error:', error)
    return NextResponse.json(
      { message: 'Failed to submit assignment', error: (error as Error).message },
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
      // Students can only see their own submission
      const submission = await AssignmentSubmission.findOne({
        assignment: id,
        student: session.user.id
      }).populate([
        { path: 'student', select: 'name email' },
        { path: 'assignment', select: 'title totalMarks dueDate' },
        { path: 'gradedBy', select: 'name email' }
      ])

      if (!submission) {
        return NextResponse.json({ message: 'No submission found' }, { status: 404 })
      }

      return NextResponse.json({ data: submission })
    } else {
      // Teachers and admins can see all submissions for the assignment
      const submissions = await AssignmentSubmission.find({
        assignment: id
      }).populate([
        { path: 'student', select: 'name email' },
        { path: 'assignment', select: 'title totalMarks dueDate' },
        { path: 'gradedBy', select: 'name email' }
      ]).sort({ submittedAt: -1 })

      return NextResponse.json({ data: submissions })
    }

  } catch (error) {
    console.error('Assignment submission fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch submission', error: (error as Error).message },
      { status: 500 }
    )
  }
}
