require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found!')
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set in .env.local or .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateTruckDetails() {
  console.log('🔄 Updating details for SML Isuzu Samrat 4760gs...\n')

  try {
    // Find the truck
    const { data: truck, error: fetchError } = await supabase
      .from('trucks')
      .select('*')
      .eq('name', 'SML Isuzu Samrat 4760gs')
      .single()

    if (fetchError) {
      console.error('❌ Error finding truck:', fetchError.message)
      return
    }

    if (!truck) {
      console.error('❌ Truck not found in database')
      return
    }

    console.log('📊 Current Details:')
    console.log(`   ID: ${truck.id}`)
    console.log(`   Name: ${truck.name}`)
    console.log(`   Model: ${truck.model}`)
    console.log(`   Year: ${truck.year}`)
    console.log(`   Kilometers: ${truck.kilometers?.toLocaleString('en-IN') || 'N/A'}`)
    console.log(`   Horsepower: ${truck.horsepower} HP`)
    console.log(`   Price: ₹${Number(truck.price).toLocaleString('en-IN')}`)
    console.log(`   Location: ${truck.location || 'N/A'}`)
    console.log(`   State: ${truck.state || 'N/A'}`)
    console.log(`   City: ${truck.city || 'N/A'}`)
    console.log(`   Subtitle: ${truck.subtitle || 'N/A'}`)
    console.log('')

    // Update with new information
    const updateData = {
      model: 'SAMRAT4760GSNGTCCABCHASSIS21F',
      year: 2022,
      kilometers: 132708, // 1,32,708 km
      horsepower: 107, // 107.20 HP (rounded to integer)
      price: 1200000, // 12.00 Lakhs
      location: 'Rajpur Road',
      state: 'Delhi',
      city: 'Delhi',
      subtitle: 'CNG • Manual • 1st Owner • 1,32,708 km • 22ft Payload'
    }

    const { data: updatedTruck, error: updateError } = await supabase
      .from('trucks')
      .update(updateData)
      .eq('id', truck.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      return
    }

    console.log('✅ Truck details updated successfully!')
    console.log('')
    console.log('📊 Updated Details:')
    console.log('='.repeat(60))
    console.log(`   ID: ${updatedTruck.id}`)
    console.log(`   Name: ${updatedTruck.name}`)
    console.log(`   Manufacturer: ${updatedTruck.manufacturer}`)
    console.log(`   Model: ${updatedTruck.model}`)
    console.log(`   Year: ${updatedTruck.year}`)
    console.log(`   Kilometers: ${updatedTruck.kilometers?.toLocaleString('en-IN')}`)
    console.log(`   Horsepower: ${updatedTruck.horsepower} HP`)
    console.log(`   Price: ₹${Number(updatedTruck.price).toLocaleString('en-IN')}`)
    console.log(`   Location: ${updatedTruck.location}`)
    console.log(`   State: ${updatedTruck.state}`)
    console.log(`   City: ${updatedTruck.city}`)
    console.log(`   Subtitle: ${updatedTruck.subtitle}`)
    console.log('='.repeat(60))
    console.log('')
    console.log('📋 Additional Information (from WEB REPORT):')
    console.log('   Insurance: 24/04/26')
    console.log('   Gearbox: 5 forward, 1 reverse')
    console.log('   RTO: RAJPUR ROAD')
    console.log('   Fuel Type: CNG')
    console.log('   Transmission: Manual')
    console.log('   Ownership Number: 1')
    console.log('   Tyres: 6')
    console.log('   Net Payload: 12,000kg')
    console.log('   Gross Payload: 16,370kg')
    console.log('   Payload in Ft: 22ft')
    console.log('')
    console.log('✅ All details have been updated in the database!')
    console.log('   The changes will be visible on the website after the next page load.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateTruckDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
