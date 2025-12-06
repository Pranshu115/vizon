import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { valuationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(valuationSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    const valuation = await safePrismaQuery(
      async (prisma) => {
        return await prisma.valuationRequest.create({
          data: validation.data
        })
      },
      null
    )
    
    if (!valuation) {
      return createErrorResponse(
        'Failed to save valuation request. Please try again later.',
        503
      )
    }
    
    return createSuccessResponse(
      valuation,
      'Valuation request received successfully',
      201
    )
  } catch (error) {
    console.error('Error saving valuation request:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
