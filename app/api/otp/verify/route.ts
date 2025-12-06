import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { otpVerifySchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { verifyOTP, isOTPExpired } from '@/lib/otp'
import crypto from 'crypto'

/**
 * Generate a verification token after successful OTP verification
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(otpVerifySchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    const { phone, otp, purpose } = validation.data

    // Find the OTP record
    const otpRecord = await safePrismaQuery(
      async (prisma) => {
        return await prisma.otpVerification.findFirst({
          where: {
            phone,
            purpose,
            verified: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      },
      null
    )

    if (!otpRecord) {
      return createErrorResponse(
        'OTP not found. Please request a new OTP.',
        404
      )
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      // Mark as expired by deleting it
      await safePrismaQuery(
        async (prisma) => {
          await prisma.otpVerification.delete({
            where: { id: otpRecord.id }
          })
        },
        null
      )
      return createErrorResponse(
        'OTP has expired. Please request a new OTP.',
        400
      )
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      // Delete the OTP record after max attempts
      await safePrismaQuery(
        async (prisma) => {
          await prisma.otpVerification.delete({
            where: { id: otpRecord.id }
          })
        },
        null
      )
      return createErrorResponse(
        'Maximum verification attempts exceeded. Please request a new OTP.',
        429
      )
    }

    // Verify OTP
    const isValid = verifyOTP(otp, otpRecord.otp)

    if (!isValid) {
      // Increment attempts
      await safePrismaQuery(
        async (prisma) => {
          await prisma.otpVerification.update({
            where: { id: otpRecord.id },
            data: {
              attempts: otpRecord.attempts + 1
            }
          })
        },
        null
      )

      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1)
      return createErrorResponse(
        `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts exceeded.'}`,
        400
      )
    }

    // OTP is valid - mark as verified and generate token
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // Token valid for 15 minutes

    await safePrismaQuery(
      async (prisma) => {
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: {
            verified: true,
            verifiedAt: new Date()
          }
        })
      },
      null
    )

    // Store verification token (we'll use a simple approach - in production, consider Redis)
    // For now, we'll return the token and the frontend should use it immediately
    // In a more secure setup, you might want to store this in a session or Redis

    return createSuccessResponse(
      {
        verified: true,
        token: verificationToken,
        expiresAt: expiresAt.toISOString(),
        purpose
      },
      'OTP verified successfully',
      200
    )
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}

