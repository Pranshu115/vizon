import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { truckSubmissionSchema, paginationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(truckSubmissionSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    const submission = await safePrismaQuery(
      async (prisma) => {
        return await prisma.truckSubmission.create({
          data: {
            ...validation.data,
            status: 'pending',
            certified: false,
          }
        })
      },
      null
    )
    
    if (!submission) {
      return createErrorResponse(
        'Failed to save truck submission. Please try again later.',
        503
      )
    }
    
    return createSuccessResponse(
      submission,
      'Truck submission received successfully',
      201
    )
  } catch (error) {
    console.error('Error saving truck submission:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'approved'
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return createErrorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      )
    }

    // Validate pagination
    const pagination = validateRequest(paginationSchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })
    
    const page = pagination.success ? pagination.data.page : 1
    const limit = pagination.success ? pagination.data.limit : 20
    const skip = (page - 1) * limit

    const result = await safePrismaQuery(
      async (prisma) => {
        const [submissions, total] = await Promise.all([
          prisma.truckSubmission.findMany({
            where: {
              status: status as 'pending' | 'approved' | 'rejected'
            },
            orderBy: {
              submittedAt: 'desc'
            },
            skip,
            take: limit,
          }),
          prisma.truckSubmission.count({
            where: {
              status: status as 'pending' | 'approved' | 'rejected'
            }
          })
        ])
        return { submissions, total, page, limit, totalPages: Math.ceil(total / limit) }
      },
      { submissions: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching truck submissions:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
