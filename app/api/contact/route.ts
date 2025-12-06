import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { contactSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Handle firstName/lastName format and convert to name
    if (body.firstName || body.lastName) {
      body.name = `${body.firstName || ''} ${body.lastName || ''}`.trim()
    }
    
    // Validate request body
    const validation = validateRequest(contactSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    const { name, email, phone, subject, message } = validation.data
    
    const submission = await safePrismaQuery(
      async (prisma) => {
        return await prisma.contactSubmission.create({
          data: {
            name,
            email,
            phone: phone || null,
            message: `${subject ? `Subject: ${subject}\n\n` : ''}${message}`,
          }
        })
      },
      null // Return null if database unavailable
    )
    
    if (!submission) {
      return createErrorResponse(
        'Failed to save contact submission. Please try again later.',
        503
      )
    }
    
    return createSuccessResponse(
      submission,
      'Contact submission received successfully',
      201
    )
  } catch (error) {
    console.error('Error saving contact submission:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
