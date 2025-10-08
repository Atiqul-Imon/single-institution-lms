import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Assignment from '@/models/Assignment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
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
    const assignment = await Assignment.findById(id)
      .populate('course', 'title subject grade students')
      .populate('module', 'title')
      .populate('teacher', 'name email')

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions based on user role
    const course = assignment.course as { students: string[]; institution?: string }
    
    if (session.user.role === UserRole.STUDENT) {
      // Students can only see assignments for courses they're enrolled in
      if (!course.students.includes(session.user.id)) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.TEACHER) {
      // Teachers can only see their own assignments
      if (assignment.teacher.toString() !== session.user.id) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.INSTITUTION_ADMIN) {
      // Institution admins can see assignments in their institution
      if (course.institution?.toString() !== session.user.institution) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
    }

    // Get student's submission if they're a student
    let studentSubmission = null
    if (session.user.role === UserRole.STUDENT) {
      studentSubmission = await AssignmentSubmission.findOne({
        assignment: id,
        student: session.user.id
      })
    }

    // Get all submissions if user is teacher or admin
    let submissions = []
    if (session.user.role === UserRole.TEACHER || session.user.role === UserRole.SUPER_ADMIN || session.user.role === UserRole.INSTITUTION_ADMIN) {
      submissions = await AssignmentSubmission.find({ assignment: id })
        .populate('student', 'name email')
        .sort({ submittedAt: -1 })
    }

    return NextResponse.json({ 
      data: {
        ...assignment.toObject(),
        studentSubmission,
        submissions
      }
    })

  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch assignment', error: (error as Error).message },
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
    const assignment = await Assignment.findById(id)
    
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the assignment or admins can edit
    const canEdit = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      assignment.teacher.toString() === session.user.id

    if (!canEdit) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowedUpdates = [
      'title', 'description', 'instructions', 'dueDate', 'totalMarks', 
      'weight', 'submissionType', 'lateSubmissionAllowed', 'latePenaltyPercentage',
      'plagiarismCheck', 'rubric', 'attachments', 'isPublished'
    ]

    const updates: Record<string, unknown> = {}
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key]
      }
    })

    // Handle date conversion
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate as string)
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('course', 'title subject grade')
     .populate('module', 'title')
     .populate('teacher', 'name email')

    if (!updatedAssignment) {
      return NextResponse.json({ message: 'Assignment update failed' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Assignment updated successfully', 
      data: updatedAssignment 
    })

  } catch (error) {
    console.error('Assignment update error:', error)
    return NextResponse.json(
      { message: 'Failed to update assignment', error: (error as Error).message },
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
    const assignment = await Assignment.findById(id)
    
    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions - only teacher who created the assignment or admins can delete
    const canDelete = 
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.INSTITUTION_ADMIN ||
      assignment.teacher.toString() === session.user.id

    if (!canDelete) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Also delete all submissions for this assignment
    await AssignmentSubmission.deleteMany({ assignment: id })
    
    // Delete the assignment
    await Assignment.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Assignment deleted successfully' })

  } catch (error) {
    console.error('Assignment deletion error:', error)
    return NextResponse.json(
      { message: 'Failed to delete assignment', error: (error as Error).message },
      { status: 500 }
    )
  }
}
