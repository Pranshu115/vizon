// Script to upload SML Isuzu Samrat 4760gs truck to Supabase
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
// Folder: SML Isuzu Samrat 4760gs
// Registration: DL1MA9541 (from PDF file names)
const truckData = {
  name: 'SML Isuzu Samrat 4760gs',
  manufacturer: 'SML Isuzu',
  model: 'Samrat 4760gs',
  year: 2020, // Default - update if you have the actual year
  kilometers: 50000, // Default - update if you have actual kilometers
  horsepower: 120, // Default - update if you have actual horsepower
  price: 1200000, // Default - update with actual price
  image_url: '/trucks/sml-isuzu-samrat-4760gs.jpg', // Placeholder - will be updated after image upload
  subtitle: 'Heavy-duty commercial truck with reliable performance',
  certified: true,
  state: 'Delhi', // DL registration
  location: 'Delhi',
  city: 'New Delhi' // Default - update if you know the actual city
}

async function uploadTruck() {
  console.log('🚀 Starting to upload SML Isuzu Samrat 4760gs to Supabase...\n')

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
      console.log('   1. Run: node upload-sml-isuzu-images.js')
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
