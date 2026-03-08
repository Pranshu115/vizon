import { NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'
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
      const truckExists = await safeSupabaseQuery(
        async (supabase) => {
          const { data, error } = await supabase
            .from('trucks')
            .select('id')
            .eq('id', validation.data.truckId)
            .single()
          return !error && data !== null
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
      const inquiry = await safeSupabaseQuery(
        async (supabase) => {
          const inquiryRecord = {
            truck_id: inquiryData.truckId,
            truck_name: inquiryData.truckName,
            name: inquiryData.name,
            email: inquiryData.email,
            phone: inquiryData.phone,
            message: inquiryData.message ?? null,
          }
          const { data, error } = await supabase
            .from('truck_inquiries')
            .insert(inquiryRecord)
            .select()
            .single()
          if (error) throw error
          return data
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
    const truckExists = await safeSupabaseQuery(
      async (supabase) => {
        const { data, error } = await supabase
          .from('trucks')
          .select('id')
          .eq('id', validation.data.truckId)
          .single()
        return !error && data !== null
      },
      false
    )

    if (!truckExists) {
      return createErrorResponse(
        'Truck not found',
        404
      )
    }

    const inquiry = await safeSupabaseQuery(
      async (supabase) => {
        const inquiryRecord = {
          truck_id: validation.data.truckId,
          truck_name: validation.data.truckName,
          name: validation.data.name,
          email: validation.data.email,
          phone: validation.data.phone,
          message: validation.data.message ?? null,
        }
        const { data, error } = await supabase
          .from('truck_inquiries')
          .insert(inquiryRecord)
          .select()
          .single()
        if (error) throw error
        return data
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
