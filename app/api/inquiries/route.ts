import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { inquirySchema, inquiryWithOTPSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { verifyOTPToken, markOTPAsUsed } from '@/lib/otp-verification'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // If an OTP token is present, use the OTP-secured flow
    const hasOtpToken = typeof body?.otpToken === 'string' && body.otpToken.length > 0

    if (hasOtpToken) {
      // Validate request body (includes OTP token)
      const validation = validateRequest(inquiryWithOTPSchema, body)
      if (!validation.success) {
        return createErrorResponse(
          'Invalid input data',
          400,
          formatValidationError(validation.error)
        )
      }

      const { phone, otpToken } = validation.data
      const purpose = 'inquiry' // Purpose is fixed for truck inquiries

      // Verify OTP token before proceeding
      const otpVerification = await verifyOTPToken(phone, purpose, otpToken)
      if (!otpVerification.valid) {
        return createErrorResponse(
          otpVerification.message || 'OTP verification required. Please verify your phone number first.',
          401
        )
      }

      // Verify truck exists
      const truckExists = await safePrismaQuery(
        async (prisma) => {
          const truck = await prisma.truck.findUnique({
            where: { id: validation.data.truckId },
            select: { id: true }
          })
          return truck !== null
        },
        false
      )

      if (!truckExists) {
        return createErrorResponse(
          'Truck not found',
          404
        )
      }

      // Create inquiry (without otpToken field)
      const { otpToken: _, ...inquiryData } = validation.data
      const inquiry = await safePrismaQuery(
        async (prisma) => {
          return await prisma.truckInquiry.create({
            data: inquiryData
          })
        },
        null
      )
      
      if (!inquiry) {
        return createErrorResponse(
          'Failed to save inquiry. Please try again later.',
          503
        )
      }

      // Mark OTP as used (cleanup)
      await markOTPAsUsed(phone, purpose)
      
      return createSuccessResponse(
        inquiry,
        'Inquiry submitted successfully. Your phone number has been verified.',
        201
      )
    }

    // Fallback: support legacy inquiries without OTP (current UI)
    const validation = validateRequest(inquirySchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    // Verify truck exists
    const truckExists = await safePrismaQuery(
      async (prisma) => {
        const truck = await prisma.truck.findUnique({
          where: { id: validation.data.truckId },
          select: { id: true }
        })
        return truck !== null
      },
      false
    )

    if (!truckExists) {
      return createErrorResponse(
        'Truck not found',
        404
      )
    }

    const inquiry = await safePrismaQuery(
      async (prisma) => {
        return await prisma.truckInquiry.create({
          data: validation.data
        })
      },
      null
    )

    if (!inquiry) {
      return createErrorResponse(
        'Failed to save inquiry. Please try again later.',
        503
      )
    }

    return createSuccessResponse(
      inquiry,
      'Inquiry submitted successfully.',
      201
    )
  } catch (error) {
    console.error('Error saving truck inquiry:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
