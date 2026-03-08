// Script to check if the ASHOK LEYLAND truck exists in the database
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from both .env.local and .env files
const envPath = path.resolve(process.cwd(), '.env')
const envLocalPath = path.resolve(process.cwd(), '.env.local')

// Load .env file first (lower priority)
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}
// Load .env.local second (higher priority, will override .env values)
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTruck() {
  console.log('🔍 Checking for ASHOK LEYLAND ECOMET STAR 1415 HE in database...\n')

  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('name', 'ASHOK LEYLAND ECOMET STAR 1415 HE')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Truck not found in database')
      } else {
        console.error('❌ Error:', error.message)
      }
      return
    }

    if (data) {
      console.log('✅ Truck found in database!\n')
      console.log('='.repeat(60))
      console.log('📊 Truck Details:')
      console.log('='.repeat(60))
      console.log(`   ID: ${data.id}`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Manufacturer: ${data.manufacturer}`)
      console.log(`   Model: ${data.model}`)
      console.log(`   Year: ${data.year}`)
      console.log(`   Kilometers: ${data.kilometers?.toLocaleString('en-IN') || 'N/A'}`)
      console.log(`   Horsepower: ${data.horsepower} HP`)
      console.log(`   Price: ₹${Number(data.price).toLocaleString('en-IN')}`)
      console.log(`   Location: ${data.location || 'N/A'}`)
      console.log(`   State: ${data.state || 'N/A'}`)
      console.log(`   City: ${data.city || 'N/A'}`)
      console.log(`   Certified: ${data.certified ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   Image URL: ${data.image_url || 'N/A'}`)
      console.log(`   Subtitle: ${data.subtitle || 'N/A'}`)
      console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`)
      console.log('='.repeat(60))
      console.log('\n✅ This truck should be visible in the "Buy Trucks" page!')
      console.log('   Visit: http://localhost:3000/browse-trucks\n')
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTruck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
