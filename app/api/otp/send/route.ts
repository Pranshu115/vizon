import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { otpRequestSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { generateOTP, hashOTP, getOTPExpiry, getOTPLength, getOTPMaxAttempts } from '@/lib/otp'
import { sendOTP } from '@/lib/sms'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(otpRequestSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    const { phone, purpose } = validation.data

    // Check for existing unverified OTP for this phone and purpose
    const existingOTP = await safePrismaQuery(
      async (prisma) => {
        return await prisma.otpVerification.findFirst({
          where: {
            phone,
            purpose,
            verified: false,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      },
      null
    )

    // If there's a valid unverified OTP, don't send a new one immediately
    // Allow resend after 1 minute to prevent spam
    if (existingOTP) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      if (existingOTP.createdAt > oneMinuteAgo) {
        return createErrorResponse(
          'Please wait before requesting a new OTP. Check your SMS for the previous code.',
          429
        )
      }
    }

    // Generate new OTP
    const otpLength = getOTPLength()
    const otp = generateOTP(otpLength)
    const otpHash = hashOTP(otp)
    const expiresAt = getOTPExpiry()

    // Delete old unverified OTPs for this phone and purpose
    await safePrismaQuery(
      async (prisma) => {
        await prisma.otpVerification.deleteMany({
          where: {
            phone,
            purpose,
            verified: false
          }
        })
      },
      null
    )

    // Save OTP to database
    const otpRecord = await safePrismaQuery(
      async (prisma) => {
        return await prisma.otpVerification.create({
          data: {
            phone,
            otp: otpHash,
            purpose,
            expiresAt,
            maxAttempts: getOTPMaxAttempts()
          }
        })
      },
      null
    )

    if (!otpRecord) {
      return createErrorResponse(
        'Failed to generate OTP. Please try again later.',
        503
      )
    }

    // Send OTP via SMS
    const smsResult = await sendOTP(phone, otp, purpose)

    if (!smsResult.success) {
      // Even if SMS fails, we return success but log the issue
      // In development, OTP is logged to console
      console.error('Failed to send OTP via SMS:', smsResult.error)
      
      // In production, if SMS fails, we should still return error
      if (process.env.NODE_ENV === 'production' && !smsResult.success) {
        // Delete the OTP record if SMS failed
        await safePrismaQuery(
          async (prisma) => {
            await prisma.otpVerification.delete({
              where: { id: otpRecord.id }
            })
          },
          null
        )
        return createErrorResponse(
          'Failed to send OTP. Please check your phone number and try again.',
          503
        )
      }
    }

    return createSuccessResponse(
      {
        message: 'OTP sent successfully',
        expiresIn: '10 minutes'
      },
      'OTP has been sent to your phone number',
      200
    )
  } catch (error) {
    console.error('Error sending OTP:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}

