// Load environment variables from both .env.local and .env files
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Get absolute paths
const envPath = path.resolve(process.cwd(), '.env')
const envLocalPath = path.resolve(process.cwd(), '.env.local')

// Load .env file first (lower priority)
let envLoaded = false
if (fs.existsSync(envPath)) {
  const envResult = dotenv.config({ path: envPath })
  if (!envResult.error) {
    envLoaded = true
    console.log('✅ Loaded .env file')
  } else {
    console.log(`⚠️  Warning loading .env: ${envResult.error.message}`)
  }
}

// Load .env.local second (higher priority, will override .env values)
let envLocalLoaded = false
if (fs.existsSync(envLocalPath)) {
  const envLocalResult = dotenv.config({ path: envLocalPath, override: true })
  if (!envLocalResult.error) {
    envLocalLoaded = true
    console.log('✅ Loaded .env.local file')
  } else {
    console.log(`⚠️  Warning loading .env.local: ${envLocalResult.error.message}`)
  }
}

if (!envLoaded && !envLocalLoaded) {
  console.warn('⚠️  Warning: Could not load .env or .env.local files')
}

// Try multiple environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY

// Debug: Show what we found (without exposing full keys)
console.log('🔍 Checking environment variables...')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Not found'}`)
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Found' : '❌ Not found'}`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Not found'}`)
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Found' : '❌ Not found'}`)
console.log(`   Final URL: ${supabaseUrl ? '✅ Found' : '❌ Not found'}`)
console.log(`   Final Key: ${supabaseKey ? '✅ Found' : '❌ Not found'}\n`)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found!')
  console.error('\n📋 Please check your .env.local or .env file and ensure you have:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key')
  console.error('\n   OR')
  console.error('   SUPABASE_URL=your-supabase-url')
  console.error('   SUPABASE_ANON_KEY=your-supabase-anon-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Truck details extracted from folder name and files
// Folder: ASHOK LEYLAND ECOMET STAR 1415 HE
// Registration: UP14LT8731 (from PDF file names)
const truckData = {
  name: 'ASHOK LEYLAND ECOMET STAR 1415 HE',
  manufacturer: 'Ashok Leyland',
  model: 'Ecomet Star 1415 HE',
  year: 2020, // Default - update if you have the actual year
  kilometers: 50000, // Default - update if you have actual kilometers
  horsepower: 141, // Based on model name 1415 (141 HP)
  price: 1500000, // Default - update with actual price
  image_url: '/trucks/ashok-leyland-ecomet-star-1415-he.jpg', // Placeholder - will need to upload image
  subtitle: 'Heavy-duty commercial truck with reliable performance',
  certified: true,
  state: 'Uttar Pradesh', // UP registration
  location: 'Uttar Pradesh',
  city: 'Lucknow' // Default - update if you know the actual city
}

async function uploadTruck() {
  console.log('🚀 Starting to upload ASHOK LEYLAND ECOMET STAR 1415 HE to Supabase...\n')

  try {
    // Check if truck already exists
    const { data: existingTrucks, error: checkError } = await supabase
      .from('trucks')
      .select('id, name')
      .eq('name', truckData.name)
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking for existing truck:', checkError.message)
      return
    }

    if (existingTrucks && existingTrucks.length > 0) {
      console.log(`\n✅ Truck "${truckData.name}" already exists in the database!`)
      console.log(`   ID: ${existingTrucks[0].id}`)
      console.log('\n💡 The truck should already be visible in the "Buy Trucks" page.')
      console.log('   If you want to update it, you can:')
      console.log('   1. Update it directly in Supabase dashboard')
      console.log('   2. Delete it first and re-run this script')
      console.log('   3. Modify this script to update instead of insert\n')
      return
    }

    // Insert the truck
    console.log('📥 Inserting truck into database...')
    const { data, error } = await supabase
      .from('trucks')
      .insert(truckData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error inserting truck:', error.message)
      console.error('Full error:', error)
      return
    }

    if (data) {
      console.log('\n✅ Successfully uploaded truck!')
      console.log('='.repeat(50))
      console.log('📊 Truck Details:')
      console.log(`   ID: ${data.id}`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Manufacturer: ${data.manufacturer}`)
      console.log(`   Model: ${data.model}`)
      console.log(`   Year: ${data.year}`)
      console.log(`   Kilometers: ${data.kilometers}`)
      console.log(`   Horsepower: ${data.horsepower}`)
      console.log(`   Price: ₹${data.price.toLocaleString('en-IN')}`)
      console.log(`   Location: ${data.location || 'N/A'}`)
      console.log(`   Certified: ${data.certified ? 'Yes' : 'No'}`)
      console.log('='.repeat(50))
      console.log('\n💡 Next steps:')
      console.log('   1. Upload truck images to Supabase Storage or public/trucks folder')
      console.log('   2. Update the image_url in the database with the actual image path')
      console.log('   3. Update year, kilometers, and price if you have the actual values')
      console.log('   4. The truck should now appear in the "Buy Trucks" page!\n')
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the upload
uploadTruck()
  .then(() => {
    console.log('✨ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
