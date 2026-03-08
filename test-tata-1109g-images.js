// Test script to verify Tata 1109g LPT images are accessible from Supabase
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const BUCKET_NAME = 'truck-images'
const FOLDER_NAME = 'TATA_1109G_LPT'

async function testImages() {
  console.log('🔍 Testing Supabase Storage access for Tata 1109g LPT...\n')
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Folder: ${FOLDER_NAME}\n`)

  try {
    // List all files in the folder
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_NAME, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listing files:', error)
      console.error('   Message:', error.message)
      return
    }

    if (!files || files.length === 0) {
      console.error('❌ No files found in folder!')
      console.error('   Make sure the folder exists and contains files.')
      return
    }

    console.log(`✅ Found ${files.length} files in folder\n`)

    // Filter image and video files
    const mediaFiles = files.filter(file => {
      const ext = file.name.toLowerCase()
      return ext.endsWith('.jpg') || 
             ext.endsWith('.jpeg') || 
             ext.endsWith('.png') || 
             ext.endsWith('.webp') || 
             ext.endsWith('.gif') ||
             ext.endsWith('.mp4') ||
             ext.endsWith('.mov')
    })

    console.log(`📸 Media files found: ${mediaFiles.length}\n`)

    if (mediaFiles.length === 0) {
      console.error('❌ No image or video files found!')
      console.log('\nAll files in folder:')
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`)
      })
      return
    }

    // Generate URLs and test accessibility
    console.log('📋 Generating public URLs...\n')
    const imageUrls = []

    for (const file of mediaFiles) {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${FOLDER_NAME}/${file.name}`)
      
      imageUrls.push(urlData.publicUrl)
      console.log(`✅ ${file.name}`)
      console.log(`   URL: ${urlData.publicUrl}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`✅ Total files: ${files.length}`)
    console.log(`✅ Media files: ${mediaFiles.length}`)
    console.log(`✅ URLs generated: ${imageUrls.length}`)
    console.log('='.repeat(60))

    // Test a few URLs
    console.log('\n🧪 Testing URL accessibility...\n')
    const testUrls = imageUrls.slice(0, 3)
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (response.ok) {
          console.log(`✅ Accessible: ${url.substring(0, 80)}...`)
        } else {
          console.log(`❌ Not accessible (${response.status}): ${url.substring(0, 80)}...`)
        }
      } catch (err) {
        console.log(`❌ Error testing: ${url.substring(0, 80)}...`)
        console.log(`   ${err.message}`)
      }
    }

    console.log('\n✨ Test complete!')
    console.log('\n💡 If URLs are accessible, the API route should work.')
    console.log('   Check the browser console for any errors when loading the truck page.\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
