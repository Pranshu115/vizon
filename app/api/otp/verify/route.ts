import { NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'
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
    const otpRecord = await safeSupabaseQuery(
      async (supabase) => {
        const { data, error } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('phone', phone)
          .eq('purpose', purpose)
          .eq('verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
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
    const expiresAt = new Date(otpRecord.expires_at)
    if (isOTPExpired(expiresAt)) {
      // Mark as expired by deleting it
      await safeSupabaseQuery(
        async (supabase) => {
          await supabase
            .from('otp_verifications')
            .delete()
            .eq('id', otpRecord.id)
        },
        null
      )
      return createErrorResponse(
        'OTP has expired. Please request a new OTP.',
        400
      )
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      // Delete the OTP record after max attempts
      await safeSupabaseQuery(
        async (supabase) => {
          await supabase
            .from('otp_verifications')
            .delete()
            .eq('id', otpRecord.id)
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
      await safeSupabaseQuery(
        async (supabase) => {
          await supabase
            .from('otp_verifications')
            .update({ attempts: otpRecord.attempts + 1 })
            .eq('id', otpRecord.id)
        },
        null
      )

      const remainingAttempts = otpRecord.max_attempts - (otpRecord.attempts + 1)
      return createErrorResponse(
        `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts exceeded.'}`,
        400
      )
    }

    // OTP is valid - mark as verified and generate token
    const verificationToken = generateVerificationToken()
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // Token valid for 15 minutes

    await safeSupabaseQuery(
      async (supabase) => {
        await supabase
          .from('otp_verifications')
          .update({
            verified: true,
            verified_at: new Date().toISOString()
          })
          .eq('id', otpRecord.id)
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
        expiresAt: tokenExpiresAt.toISOString(),
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

