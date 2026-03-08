import { NextResponse } from 'next/server'
import { safeSupabaseQuery, type Truck } from '@/lib/supabase'
import { truckCreateSchema, paginationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { seedTrucks } from '@/lib/seed-data'

type TruckWithNumberPrice = {
  id: number
  name: string
  manufacturer: string
  model: string
  year: number
  kilometers: number
  horsepower: number
  price: number
  imageUrl: string
  subtitle: string | null
  certified: boolean
  state: string | null
  location: string | null
  city: string | null
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate pagination
    const pagination = validateRequest(paginationSchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })
    
    const page = pagination.success ? pagination.data.page : 1
    const limit = pagination.success ? pagination.data.limit : 20
    const skip = (page - 1) * limit

    const result = await safeSupabaseQuery<{
      trucks: TruckWithNumberPrice[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>(
      async (supabase) => {
        // Get total count
        const { count } = await supabase
          .from('trucks')
          .select('*', { count: 'exact', head: true })
          .eq('certified', true)

        // Get paginated trucks
        const { data: trucks, error } = await supabase
          .from('trucks')
          .select('*')
          .eq('certified', true)
          .order('created_at', { ascending: false })
          .range(skip, skip + limit - 1)

        if (error) {
          throw error
        }

        // Convert Supabase format to API format
        const trucksWithNumberPrice: TruckWithNumberPrice[] = (trucks || []).map((truck: Truck) => ({
          id: truck.id,
          name: truck.name,
          manufacturer: truck.manufacturer,
          model: truck.model,
          year: truck.year,
          kilometers: truck.kilometers,
          horsepower: truck.horsepower,
          price: Number(truck.price),
          imageUrl: truck.image_url,
          subtitle: truck.subtitle ?? null,
          certified: truck.certified,
          state: truck.state ?? null,
          location: truck.location ?? null,
          city: truck.city ?? null,
          createdAt: new Date(truck.created_at),
          updatedAt: new Date(truck.updated_at),
        }))

        const total = count || 0
        return { trucks: trucksWithNumberPrice, total, page, limit, totalPages: Math.ceil(total / limit) }
      },
      // Fallback to seed data when database is unavailable
      (() => {
        const certifiedTrucks = seedTrucks.filter(t => t.certified)
        const paginatedTrucks = certifiedTrucks.slice(skip, skip + limit).map(truck => ({
          ...truck,
          subtitle: truck.subtitle ?? null,
          state: null,
          location: null,
          city: null,
        })) as TruckWithNumberPrice[]
        return {
          trucks: paginatedTrucks,
          total: certifiedTrucks.length,
          page,
          limit,
          totalPages: Math.ceil(certifiedTrucks.length / limit)
        }
      })()
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching trucks:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(truckCreateSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    // TODO: Add authentication check here
    // For now, we'll allow it but in production, add proper auth

    const truck = await safeSupabaseQuery<TruckWithNumberPrice | null>(
      async (supabase) => {
        // Convert API format to Supabase format
        const truckData = {
          name: validation.data.name,
          manufacturer: validation.data.manufacturer,
          model: validation.data.model,
          year: validation.data.year,
          kilometers: validation.data.kilometers,
          horsepower: validation.data.horsepower,
          price: validation.data.price,
          image_url: validation.data.imageUrl,
          subtitle: validation.data.subtitle ?? null,
          certified: validation.data.certified ?? true,
          state: null,
          location: null,
          city: null,
        }

        const { data: result, error } = await supabase
          .from('trucks')
          .insert(truckData)
          .select()
          .single()

        if (error) {
          throw error
        }

        if (!result) {
          return null
        }

        // Convert Supabase format to API format
        return {
          id: result.id,
          name: result.name,
          manufacturer: result.manufacturer,
          model: result.model,
          year: result.year,
          kilometers: result.kilometers,
          horsepower: result.horsepower,
          price: Number(result.price),
          imageUrl: result.image_url,
          subtitle: result.subtitle ?? null,
          certified: result.certified,
          state: result.state ?? null,
          location: result.location ?? null,
          city: result.city ?? null,
          createdAt: new Date(result.created_at),
          updatedAt: new Date(result.updated_at),
        }
      },
      null
    )
    
    if (!truck) {
      return createErrorResponse(
        'Failed to create truck. Please try again later.',
        503
      )
    }
    
    return createSuccessResponse(
      truck,
      'Truck created successfully',
      201
    )
  } catch (error) {
    console.error('Error creating truck:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
