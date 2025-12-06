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

    const truck = await safePrismaQuery(
      async (prisma) => {
        const result = await prisma.truck.findUnique({
          where: {
            id: truckId,
          },
        })
        // Convert Decimal to number for JSON serialization
        if (result) {
          return {
            ...result,
            price: Number(result.price),
            subtitle: result.subtitle || undefined,
          }
        }
        return null
      },
      // Fallback to seed data when database is unavailable
      seedTrucks.find(t => t.id === truckId) || null
    )

    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(truck)
  } catch (error) {
    console.error('Error fetching truck:', error)
    return NextResponse.json(
      { error: 'Failed to fetch truck details' },
      { status: 500 }
    )
  }
}
