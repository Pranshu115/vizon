const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const MAPPING_FILE = path.join(__dirname, '..', 'image-upload-mapping.json')

// Map old local paths to new Supabase URLs
// This is a basic mapping - you may need to adjust based on your actual image URLs
function getSupabaseUrlForImage(oldImageUrl) {
  // If already a Supabase URL, return as is
  if (oldImageUrl && oldImageUrl.includes('supabase.co')) {
    return oldImageUrl
  }

  // Try to find in mapping file
  if (fs.existsSync(MAPPING_FILE)) {
    const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'))
    const fileName = path.basename(oldImageUrl)
    
    // Try exact match first
    const exactMatch = mapping.find(m => m.originalName === fileName)
    if (exactMatch) {
      return exactMatch.supabaseUrl
    }

    // Try partial match (without extension)
    const baseName = path.basename(fileName, path.extname(fileName))
    const partialMatch = mapping.find(m => {
      const mBaseName = path.basename(m.originalName, path.extname(m.originalName))
      return mBaseName === baseName
    })
    if (partialMatch) {
      return partialMatch.supabaseUrl
    }
  }

  // If no mapping found, return original URL
  return oldImageUrl
}

async function updateTruckImages() {
  console.log('🔄 Updating truck images in database...\n')

  // Fetch all trucks
  const { data: trucks, error: fetchError } = await supabase
    .from('trucks')
    .select('id, name, image_url')

  if (fetchError) {
    console.error('❌ Error fetching trucks:', fetchError.message)
    return
  }

  if (!trucks || trucks.length === 0) {
    console.log('⚠️  No trucks found in database')
    return
  }

  console.log(`📊 Found ${trucks.length} trucks to update\n`)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const truck of trucks) {
    const oldUrl = truck.image_url
    const newUrl = getSupabaseUrlForImage(oldUrl)

    // Skip if URL hasn't changed
    if (oldUrl === newUrl) {
      console.log(`⏭️  Skipped: ${truck.name} (already using Supabase URL or no mapping found)`)
      skippedCount++
      continue
    }

    // Update truck with new URL
    const { error: updateError } = await supabase
      .from('trucks')
      .update({ image_url: newUrl })
      .eq('id', truck.id)

    if (updateError) {
      console.error(`❌ Error updating ${truck.name}:`, updateError.message)
      errorCount++
    } else {
      console.log(`✅ Updated: ${truck.name}`)
      console.log(`   Old: ${oldUrl}`)
      console.log(`   New: ${newUrl}`)
      updatedCount++
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('\n📊 Update Summary:')
  console.log(`✅ Successfully updated: ${updatedCount} trucks`)
  console.log(`⏭️  Skipped: ${skippedCount} trucks`)
  console.log(`❌ Errors: ${errorCount} trucks`)
}

updateTruckImages()
  .then(() => {
    console.log('\n✅ Database update completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

