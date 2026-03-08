// Script to update Tata 1109g LPT truck with detailed information
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
const envLocalPath = path.resolve(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found')
  console.error('   Make sure you have:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateTruckData() {
  console.log('🚀 Updating Tata 1109g LPT truck data...\n')

  // Find the truck by name (try different variations)
  const truckNameVariations = [
    'TATA MOTORS 1109G LPT',
    'Tata 1109g LPT',
    'Tata 1109 G LPT',
    'TATA 1109G LPT'
  ]

  let truck = null
  let truckName = null

  for (const name of truckNameVariations) {
    const { data, error } = await supabase
      .from('trucks')
      .select('id, name')
      .eq('name', name)
      .maybeSingle()

    if (data && !error) {
      truck = data
      truckName = name
      console.log(`✅ Found truck: "${name}" (ID: ${truck.id})`)
      break
    }
  }

  if (!truck) {
    console.error('❌ Truck not found in database')
    console.error('   Searched for:', truckNameVariations.join(', '))
    console.error('\n💡 Please make sure:')
    console.error('   1. The truck exists in the database')
    console.error('   2. The truck name matches one of the variations')
    process.exit(1)
  }

  // Update truck with new information
  const updateData = {
    price: 1450000, // 14.50 Lakhs = ₹14,50,000
    model: 'DCR49CBC 85B6M5XD',
    year: 2023, // Year of Manufacturing: 03/2023
    kilometers: 162134, // Kms Driven: 1,62,134
    fuel_type: 'Diesel',
    rto: 'GURUGRAM',
    insurance_date: '2026-04-06', // Insurance: 06/04/2026 (Format: YYYY-MM-DD)
    horsepower: 85,
    transmission: 'Manual',
    gearbox: '5 forward, 1 reverse',
    ownership_number: 1,
    tyres: 6,
    payload_capacity_net: '500kg', // Net Payload: 500kg
    payload_capacity_gross: '11,250kg', // Gross Payload
    payload_capacity_ft: '22ft', // Payload in Ft
    location: 'GURUGRAM', // Location: GURUGRAM (replacing Chandigarh)
    city: 'Gurgaon', // City: Gurgaon
  }

  console.log('\n📝 Updating truck with:')
  console.log(`   Price: ₹${updateData.price.toLocaleString('en-IN')} (${(updateData.price / 100000).toFixed(2)} Lakhs)`)
  console.log(`   Model: ${updateData.model}`)
  console.log(`   Year: ${updateData.year}`)
  console.log(`   Kilometers: ${updateData.kilometers.toLocaleString('en-IN')}`)
  console.log(`   Fuel Type: ${updateData.fuel_type}`)
  console.log(`   RTO: ${updateData.rto}`)
  console.log(`   Insurance Date: ${updateData.insurance_date}`)
  console.log(`   Horsepower: ${updateData.horsepower}`)
  console.log(`   Transmission: ${updateData.transmission}`)
  console.log(`   Gearbox: ${updateData.gearbox}`)
  console.log(`   Ownership Number: ${updateData.ownership_number}`)
  console.log(`   Tyres: ${updateData.tyres}`)
  console.log(`   Net Payload: ${updateData.payload_capacity_net}`)
  console.log(`   Gross Payload: ${updateData.payload_capacity_gross}`)
  console.log(`   Payload in Ft: ${updateData.payload_capacity_ft}`)
  console.log(`   Location: ${updateData.location}`)
  console.log(`   City: ${updateData.city}`)

  const { data: updatedTruck, error: updateError } = await supabase
    .from('trucks')
    .update(updateData)
    .eq('id', truck.id)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error updating truck:', updateError.message)
    console.error('   Details:', JSON.stringify(updateError, null, 2))
    
    if (updateError.message.includes('column') || updateError.code === 'PGRST204') {
      console.error('\n💡 The columns might not exist yet.')
      console.error('   Please run the SQL migration first in Supabase SQL Editor:')
      console.error('\n   SQL to run:')
      console.error('   ALTER TABLE trucks')
      console.error('   ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS rto VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS insurance_date DATE,')
      console.error('   ADD COLUMN IF NOT EXISTS payload_capacity_net VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS payload_capacity_gross VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS payload_capacity_ft VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS gearbox VARCHAR(255),')
      console.error('   ADD COLUMN IF NOT EXISTS ownership_number INTEGER,')
      console.error('   ADD COLUMN IF NOT EXISTS tyres INTEGER;')
      console.error('\n   Or use the file: add-truck-details-columns.sql')
    }
    
    process.exit(1)
  }

  console.log('\n✅ Successfully updated truck!')
  console.log(`   Truck ID: ${updatedTruck.id}`)
  console.log(`   Truck Name: ${updatedTruck.name}`)
  console.log(`   Price: ₹${updatedTruck.price ? updatedTruck.price.toLocaleString('en-IN') : 'N/A'}`)
  console.log(`   Model: ${updatedTruck.model || 'N/A'}`)
  console.log(`   Year: ${updatedTruck.year || 'N/A'}`)
  console.log(`   Kilometers: ${updatedTruck.kilometers ? updatedTruck.kilometers.toLocaleString('en-IN') : 'N/A'}`)
  console.log(`   Fuel Type: ${updatedTruck.fuel_type || 'N/A'}`)
  console.log(`   RTO: ${updatedTruck.rto || 'N/A'}`)
  console.log(`   Insurance Date: ${updatedTruck.insurance_date || 'N/A'}`)
  console.log(`   Horsepower: ${updatedTruck.horsepower || 'N/A'}`)
  console.log(`   Transmission: ${updatedTruck.transmission || 'N/A'}`)
  console.log(`   Gearbox: ${updatedTruck.gearbox || 'N/A'}`)
  console.log(`   Ownership Number: ${updatedTruck.ownership_number || 'N/A'}`)
  console.log(`   Tyres: ${updatedTruck.tyres || 'N/A'}`)
  console.log(`   Net Payload: ${updatedTruck.payload_capacity_net || 'N/A'}`)
  console.log(`   Gross Payload: ${updatedTruck.payload_capacity_gross || 'N/A'}`)
  console.log(`   Payload in Ft: ${updatedTruck.payload_capacity_ft || 'N/A'}`)
  console.log(`   Location: ${updatedTruck.location || 'N/A'}`)
  console.log(`   City: ${updatedTruck.city || 'N/A'}`)
  console.log('\n✨ All done!')
}

updateTruckData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
