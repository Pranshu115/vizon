import { NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'
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

    const valuation = await safeSupabaseQuery(
      async (supabase) => {
        const valuationData = {
          name: validation.data.name,
          email: validation.data.email,
          phone: validation.data.phone,
          truck_manufacturer: validation.data.truckManufacturer,
          truck_model: validation.data.truckModel,
          year: validation.data.year,
          kilometers: validation.data.kilometers,
          condition: validation.data.condition,
          additional_info: validation.data.additionalInfo ?? null,
        }
        const { data, error } = await supabase
          .from('valuation_requests')
          .insert(valuationData)
          .select()
          .single()
        if (error) throw error
        return data
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
