import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Helper function to validate request body with Zod schema
 */
export function validateRequest<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

/**
 * Helper function to format Zod validation errors for API response
 */
export function formatValidationError(error: ZodError | unknown) {
  // Check if it's a ZodError
  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      details: error.issues.map((err) => ({
        path: err.path ? err.path.join('.') : 'unknown',
        message: err.message || 'Validation error',
      })),
    }
  }
  
  // Fallback for non-Zod errors or malformed errors
  return {
    error: 'Validation failed',
    details: [
      {
        path: 'unknown',
        message: error instanceof Error ? error.message : 'Invalid input data',
      },
    ],
  }
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  const response: { error: string; details?: unknown } = {
    error: message,
  }
  if (details) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

/**
 * Helper function to create standardized success responses
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
) {
  return NextResponse.json(
    {
      ...(message && { message }),
      data,
    },
    { status }
  )
}

