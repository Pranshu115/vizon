import { NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'

// Truck details for ASHOK LEYLAND ECOMET STAR 1415 HE
const truckData = {
  name: 'ASHOK LEYLAND ECOMET STAR 1415 HE',
  manufacturer: 'Ashok Leyland',
  model: 'Ecomet Star 1415 HE',
  year: 2020, // Update if you have the actual year
  kilometers: 50000, // Update if you have actual kilometers
  horsepower: 141, // Based on model name 1415
  price: 1500000, // Update with actual price
  image_url: '/trucks/ashok-leyland-ecomet-star-1415-he.jpg', // Placeholder - update with actual image
  subtitle: 'Heavy-duty commercial truck with reliable performance',
  certified: true,
  state: 'Uttar Pradesh', // UP registration
  location: 'Uttar Pradesh',
  city: 'Lucknow' // Update if you know the actual city
}

export async function POST(request: Request) {
  try {
    const result = await safeSupabaseQuery<{ success: boolean; data?: any; error?: string }>(
      async (supabase) => {
        // Check if truck already exists
        const { data: existingTrucks } = await supabase
          .from('trucks')
          .select('id, name')
          .eq('name', truckData.name)
          .limit(1)

        if (existingTrucks && existingTrucks.length > 0) {
          return {
            success: false,
            error: `Truck "${truckData.name}" already exists with ID: ${existingTrucks[0].id}`
          }
        }

        // Insert the truck
        const { data, error } = await supabase
          .from('trucks')
          .insert(truckData)
          .select()
          .single()

        if (error) {
          return {
            success: false,
            error: error.message
          }
        }

        return {
          success: true,
          data: data
        }
      },
      {
        success: false,
        error: 'Supabase client not initialized'
      }
    )

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Truck uploaded successfully!',
          truck: result.data
        },
        { status: 201 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to upload truck'
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error uploading truck:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Use POST to upload the ASHOK LEYLAND ECOMET STAR 1415 HE truck',
    truckData: truckData
  })
}
