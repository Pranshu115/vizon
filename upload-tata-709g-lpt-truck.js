// Script to upload Tata 709g LPT truck to Supabase
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

// Get the first image URL from the mapping file
let mainImageUrl = '/trucks/tata-709g-lpt.jpg' // Fallback
try {
  const mappingFile = path.join(__dirname, 'tata-709g-lpt-image-mapping.json')
  if (fs.existsSync(mappingFile)) {
    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'))
    if (Array.isArray(mapping) && mapping.length > 0 && mapping[0].supabaseUrl) {
      mainImageUrl = mapping[0].supabaseUrl
      console.log(`✅ Using first uploaded image as main image: ${mainImageUrl}\n`)
    }
  }
} catch (error) {
  console.warn('⚠️  Could not read mapping file, using fallback image URL')
}

// Truck details - update these with actual values if you have them
const truckData = {
  name: 'Tata 709g LPT',
  manufacturer: 'Tata Motors',
  model: '709g LPT',
  year: 2021, // Default - update if you have the actual year
  kilometers: 60000, // Default - update if you have actual kilometers
  horsepower: 70, // Default - update if you have actual horsepower
  price: 650000, // Default - update with actual price (₹6.5 Lakhs)
  image_url: mainImageUrl,
  subtitle: 'Reliable and efficient light commercial truck',
  certified: true,
  state: 'Delhi', // Default - update if you know the actual state
  location: 'Delhi',
  city: 'Delhi' // Default - update if you know the actual city
}

async function uploadTruck() {
  console.log('🚀 Starting to upload Tata 709g LPT to Supabase...\n')

  try {
    // Check if truck already exists (try different name variations)
    const nameVariations = [
      'Tata 709g LPT',
      'TATA 709G LPT',
      'Tata Motors 709g LPT',
      'Tata 709 g LPT',
      'Tata 709 G LPT'
    ]
    
    for (const name of nameVariations) {
      const { data: existingTrucks, error: checkError } = await supabase
        .from('trucks')
        .select('id, name')
        .eq('name', name)
        .limit(1)

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking for "${name}":`, checkError.message)
        continue
      }

      if (existingTrucks && existingTrucks.length > 0) {
        console.log(`\n✅ Truck "${name}" already exists in the database!`)
        console.log(`   ID: ${existingTrucks[0].id}`)
        console.log('\n💡 The truck should already be visible in the "Browse Trucks" page.')
        console.log('   If you want to update it, you can:')
        console.log('   1. Update it directly in Supabase dashboard')
        console.log('   2. Delete it first and re-run this script')
        console.log('   3. Modify this script to update instead of insert\n')
        return
      }
    }

    // Insert the truck
    console.log('📥 Inserting truck into database...')
    console.log('📋 Truck data:', JSON.stringify(truckData, null, 2))
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
      console.log(`   Certified: ${data.certified ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   Image URL: ${data.image_url}`)
      console.log('='.repeat(50))
      console.log('\n💡 Next steps:')
      console.log('   1. ✅ Images are already uploaded to Supabase Storage')
      console.log('   2. ✅ API routes need to be configured to load images')
      console.log('   3. ✅ Truck details page needs to be set up to display images')
      console.log('   4. ✅ The truck should now appear in the "Browse Trucks" page!')
      console.log('\n🌐 Visit: http://localhost:3000/browse-trucks\n')
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
