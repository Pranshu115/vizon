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
  console.log('🔄 Updating details for Mahindra Bolero Maxitruck Plus...\n')

  try {
    // Find the truck
    const { data: truck, error: fetchError } = await supabase
      .from('trucks')
      .select('*')
      .eq('name', 'Mahindra Bolero Maxitruck Plus')
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
      model: 'BMT PLUS CNG PS BSVI',
      year: 2022, // 07/2022
      kilometers: 59456, // 59,456 km
      horsepower: 67, // 67.00 HP (rounded to integer)
      price: 620000, // 6.2 Lakhs (already updated, but including for completeness)
      location: 'Rajpur Road',
      state: 'Delhi',
      city: 'Delhi',
      subtitle: 'CNG • Manual • 1st Owner • 59,456 km • 08ft Payload'
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
    console.log('   Insurance: 01/09/26')
    console.log('   Gearbox: 5 forward, 1 reverse')
    console.log('   RTO: RAJPUR ROAD')
    console.log('   Fuel Type: CNG')
    console.log('   Transmission: Manual')
    console.log('   Ownership Number: 1')
    console.log('   Tyres: 4')
    console.log('   Net Payload: 1,600kg')
    console.log('   Gross Payload: 2,750kg')
    console.log('   Payload in Ft: 08ft')
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
