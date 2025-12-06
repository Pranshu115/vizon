import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { truckCreateSchema, paginationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { seedTrucks } from '@/lib/seed-data'

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

    const result = await safePrismaQuery(
      async (prisma) => {
        const [trucks, total] = await Promise.all([
          prisma.truck.findMany({
            where: {
              certified: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take: limit,
          }),
          prisma.truck.count({
            where: {
              certified: true
            }
          })
        ])
        // Convert Decimal to number for all trucks
        const trucksWithNumberPrice = trucks.map(truck => ({
          ...truck,
          price: Number(truck.price),
          subtitle: truck.subtitle || undefined,
        }))
        return { trucks: trucksWithNumberPrice, total, page, limit, totalPages: Math.ceil(total / limit) }
      },
      // Fallback to seed data when database is unavailable
      (() => {
        const certifiedTrucks = seedTrucks.filter(t => t.certified)
        const paginatedTrucks = certifiedTrucks.slice(skip, skip + limit)
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

    const truck = await safePrismaQuery(
      async (prisma) => {
        const result = await prisma.truck.create({
          data: validation.data
        })
        // Convert Decimal to number
        return {
          ...result,
          price: Number(result.price),
          subtitle: result.subtitle || undefined,
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
