import { NextRequest, NextResponse } from 'next/server'
import { safePrismaQuery } from '@/lib/prisma'
import { seedTrucks } from '@/lib/seed-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const truckId = parseInt(id)

    if (isNaN(truckId)) {
      return NextResponse.json(
        { error: 'Invalid truck ID' },
        { status: 400 }
      )
    }

    // First, get the current truck to find similar ones
    const currentTruck = await safePrismaQuery(
      async (prisma) => {
        const result = await prisma.truck.findUnique({
          where: { id: truckId },
        })
        // Convert Decimal to number
        if (result) {
          return {
            ...result,
            price: Number(result.price),
            subtitle: result.subtitle || undefined,
          }
        }
        return null
      },
      // Fallback to seed data
      seedTrucks.find(t => t.id === truckId) || null
    )

    if (!currentTruck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      )
    }

    // Find similar trucks based on manufacturer or price range
    const priceMin = Number(currentTruck.price) * 0.7
    const priceMax = Number(currentTruck.price) * 1.3

    const similarTrucks = await safePrismaQuery(
      async (prisma) => {
        const results = await prisma.truck.findMany({
          where: {
            AND: [
              { id: { not: truckId } },
              {
                OR: [
                  { manufacturer: currentTruck.manufacturer },
                  {
                    price: {
                      gte: priceMin,
                      lte: priceMax,
                    }
                  }
                ]
              }
            ]
          },
          take: 4,
          orderBy: [
            { manufacturer: 'asc' },
            { createdAt: 'desc' }
          ]
        })
        // Convert Decimal to number for all trucks
        return results.map(truck => ({
          ...truck,
          price: Number(truck.price),
          subtitle: truck.subtitle || undefined,
        }))
      },
      // Fallback to seed data - find similar trucks
      (() => {
        return seedTrucks
          .filter(t => t.id !== truckId)
          .filter(t => 
            t.manufacturer === currentTruck.manufacturer ||
            (Number(t.price) >= priceMin && Number(t.price) <= priceMax)
          )
          .slice(0, 4)
      })()
    )

    return NextResponse.json(similarTrucks)
  } catch (error) {
    console.error('Error fetching similar trucks:', error)
    // Return empty array instead of error object to prevent .map() errors
    return NextResponse.json([], { status: 200 })
  }
}

