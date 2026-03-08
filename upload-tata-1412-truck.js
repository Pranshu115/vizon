// Script to upload Tata 1412 LPT truck to Supabase
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
  console.error('   Make sure you have:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Truck details extracted from folder name and files
// Folder: Tata 1412 LPT
// Registration: HR69E1703 (from PDF file names)
const truckData = {
  name: 'Tata 1412 LPT',
  manufacturer: 'Tata',
  model: '1412 LPT',
  year: 2020, // Default - update if you have the actual year
  kilometers: 55000, // Default - update if you have actual kilometers
  horsepower: 140, // Default - update if you have actual horsepower
  price: 1100000, // Default - update with actual price
  image_url: '/trucks/tata-1412-lpt.jpg', // Placeholder - will be updated after image upload
  subtitle: 'Heavy-duty commercial truck with reliable performance',
  certified: true,
  state: 'Haryana', // HR registration
  location: 'Haryana',
  city: 'Gurgaon' // Default - update if you know the actual city
}

async function uploadTruck() {
  console.log('🚀 Starting to upload Tata 1412 LPT to Supabase...\n')

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
      console.log('   1. Run: node upload-tata-1412-images.js')
      console.log('   2. This will upload all images to Supabase Storage')
      console.log('   3. Update the truck details page to display all images')
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
