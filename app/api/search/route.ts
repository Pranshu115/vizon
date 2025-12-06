import { NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { searchQuerySchema, paginationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ trucks: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    }
    
    // Validate search query
    const queryValidation = validateRequest(searchQuerySchema, { q: query })
    if (!queryValidation.success) {
      return createErrorResponse(
        'Invalid search query',
        400,
        formatValidationError(queryValidation.error)
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
    
    const result = await safePrismaQuery(
      async (prisma) => {
        // Log search query (non-blocking)
        prisma.searchQuery.create({
          data: { query: queryValidation.data.q }
        }).catch(() => {
          // Silently fail if logging fails
        })
        
        // Search trucks
        const [trucks, total] = await Promise.all([
          prisma.truck.findMany({
            where: {
              certified: true,
              OR: [
                { name: { contains: queryValidation.data.q, mode: 'insensitive' } },
                { manufacturer: { contains: queryValidation.data.q, mode: 'insensitive' } },
                { model: { contains: queryValidation.data.q, mode: 'insensitive' } },
              ]
            },
            skip,
            take: limit,
            orderBy: {
              createdAt: 'desc'
            }
          }),
          prisma.truck.count({
            where: {
              certified: true,
              OR: [
                { name: { contains: queryValidation.data.q, mode: 'insensitive' } },
                { manufacturer: { contains: queryValidation.data.q, mode: 'insensitive' } },
                { model: { contains: queryValidation.data.q, mode: 'insensitive' } },
              ]
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
      { trucks: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching trucks:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
