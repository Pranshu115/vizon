const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
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

const BUCKET_NAME = 'truck-images'
const TRUCKS_IMAGE_DIR = path.join(__dirname, '..', 'public', 'trucks')

async function uploadImageToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const fileExtension = path.extname(fileName)
    const baseName = path.basename(fileName, fileExtension)
    
    // Create unique filename with timestamp
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${baseName}${fileExtension}`

    console.log(`📤 Uploading: ${fileName} → ${uniqueFileName}`)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, fileBuffer, {
        contentType: `image/${fileExtension.slice(1)}`,
        upsert: false
      })

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error.message)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName)

    console.log(`✅ Uploaded: ${fileName}`)
    console.log(`   URL: ${urlData.publicUrl}`)

    return {
      originalName: fileName,
      supabaseFileName: uniqueFileName,
      supabaseUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message)
    return null
  }
}

async function getAllImageFiles() {
  try {
    if (!fs.existsSync(TRUCKS_IMAGE_DIR)) {
      console.error(`❌ Directory not found: ${TRUCKS_IMAGE_DIR}`)
      return []
    }

    const files = fs.readdirSync(TRUCKS_IMAGE_DIR)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    })

    return imageFiles.map(file => ({
      name: file,
      path: path.join(TRUCKS_IMAGE_DIR, file)
    }))
  } catch (error) {
    console.error('❌ Error reading image directory:', error.message)
    return []
  }
}

async function main() {
  console.log('🚀 Starting image upload to Supabase Storage...\n')
  console.log(`📁 Reading images from: ${TRUCKS_IMAGE_DIR}\n`)

  const imageFiles = await getAllImageFiles()

  if (imageFiles.length === 0) {
    console.log('⚠️  No image files found in public/trucks/ directory')
    return
  }

  console.log(`📊 Found ${imageFiles.length} image files to upload\n`)
  console.log('='.repeat(60))

  const uploadResults = []
  let successCount = 0
  let errorCount = 0

  for (const imageFile of imageFiles) {
    const result = await uploadImageToSupabase(imageFile.path, imageFile.name)
    if (result) {
      uploadResults.push(result)
      successCount++
    } else {
      errorCount++
    }
    console.log('') // Empty line for readability
  }

  console.log('='.repeat(60))
  console.log('\n📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} images`)
  console.log(`❌ Failed to upload: ${errorCount} images`)

  // Save mapping file for database update
  const mappingFile = path.join(__dirname, '..', 'image-upload-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadResults, null, 2))
  console.log(`\n💾 Upload mapping saved to: ${mappingFile}`)
  console.log('\n📝 Next step: Update database with new Supabase URLs')
  console.log('   Run: node scripts/update-database-images.js')
}

main()
  .then(() => {
    console.log('\n✅ Image upload process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

