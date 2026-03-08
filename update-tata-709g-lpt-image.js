// Script to update Tata 709g LPT truck's main image URL
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateTruckImage() {
  console.log('🔄 Updating Tata 709g LPT truck image...\n')

  try {
    // Get first image from mapping file
    const mappingFile = path.join(__dirname, 'tata-709g-lpt-image-mapping.json')
    if (!fs.existsSync(mappingFile)) {
      console.error('❌ Mapping file not found:', mappingFile)
      return
    }

    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'))
    if (!Array.isArray(mapping) || mapping.length === 0) {
      console.error('❌ Mapping file is empty or invalid')
      return
    }

    const mainImageUrl = mapping[0].supabaseUrl
    console.log(`📸 Main image URL: ${mainImageUrl}\n`)

    // Try different name variations
    const nameVariations = [
      'Tata 709g LPT',
      'Tata 709 G LPT',
      'TATA 709G LPT',
      'TATA 709 G LPT',
      'Tata Motors 709g LPT'
    ]

    let truckId = null
    let foundName = null

    for (const name of nameVariations) {
      const { data: truck, error } = await supabase
        .from('trucks')
        .select('id, name')
        .eq('name', name)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error checking "${name}":`, error.message)
        continue
      }

      if (truck) {
        truckId = truck.id
        foundName = truck.name
        console.log(`✅ Found truck: "${foundName}" (ID: ${truckId})`)
        break
      }
    }

    if (!truckId) {
      console.error('❌ Truck not found in database')
      return
    }

    // Update the truck's main image
    const { error: updateError } = await supabase
      .from('trucks')
      .update({ image_url: mainImageUrl })
      .eq('id', truckId)

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      return
    }

    console.log(`\n✅ Successfully updated truck image!`)
    console.log(`   Truck ID: ${truckId}`)
    console.log(`   Truck Name: ${foundName}`)
    console.log(`   Image URL: ${mainImageUrl}\n`)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateTruckImage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
