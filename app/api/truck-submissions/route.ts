import { NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'
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

    const submission = await safeSupabaseQuery(
      async (supabase) => {
        const submissionData = {
          seller_name: validation.data.sellerName,
          seller_email: validation.data.sellerEmail,
          seller_phone: validation.data.sellerPhone,
          manufacturer: validation.data.manufacturer,
          model: validation.data.model,
          year: validation.data.year,
          registration_number: validation.data.registrationNumber ?? null,
          kilometers: validation.data.kilometers,
          fuel_type: validation.data.fuelType,
          transmission: validation.data.transmission,
          horsepower: validation.data.horsepower ?? null,
          engine_capacity: validation.data.engineCapacity ?? null,
          condition: validation.data.condition,
          owner_number: validation.data.ownerNumber,
          asking_price: validation.data.askingPrice,
          negotiable: validation.data.negotiable ?? true,
          location: validation.data.location,
          state: validation.data.state,
          city: validation.data.city,
          features: validation.data.features ?? null,
          description: validation.data.description ?? null,
          images: validation.data.images,
          status: 'pending',
          certified: false,
        }
        const { data, error } = await supabase
          .from('truck_submissions')
          .insert(submissionData)
          .select()
          .single()
        if (error) throw error
        return data
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

    const result = await safeSupabaseQuery(
      async (supabase) => {
        // Get total count
        const { count } = await supabase
          .from('truck_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', status)

        // Get paginated submissions
        const { data: submissions, error } = await supabase
          .from('truck_submissions')
          .select('*')
          .eq('status', status)
          .order('submitted_at', { ascending: false })
          .range(skip, skip + limit - 1)

        if (error) {
          throw error
        }

        const total = count || 0
        return { submissions: submissions || [], total, page, limit, totalPages: Math.ceil(total / limit) }
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
