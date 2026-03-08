// Script to upload all Tata 1412 LPT images to Supabase Storage
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

const BUCKET_NAME = 'truck-images'
const TRUCK_FOLDER_NAME = 'TATA_1412_LPT'
const SOURCE_FOLDER = path.join(__dirname, 'Tata 1412 LPT')

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4'
  }
  return types[ext] || 'image/jpeg'
}

function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
}

async function uploadImageToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const timestamp = Date.now()
    const fileExtension = path.extname(fileName)
    const baseName = path.basename(fileName, fileExtension)
    
    // Create unique filename: timestamp-originalname.ext
    const uniqueFileName = `${TRUCK_FOLDER_NAME}/${timestamp}-${baseName}${fileExtension}`

    console.log(`📤 Uploading: ${fileName}`)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(fileName),
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
    const files = fs.readdirSync(SOURCE_FOLDER)
    return files
      .filter(file => isImageFile(file))
      .map(file => ({
        name: file,
        path: path.join(SOURCE_FOLDER, file)
      }))
  } catch (error) {
    console.error('❌ Error reading source folder:', error.message)
    return []
  }
}

async function updateTruckWithImages(imageUrls) {
  try {
    // Get the truck ID
    const { data: truck, error: truckError } = await supabase
      .from('trucks')
      .select('id')
      .eq('name', 'Tata 1412 LPT')
      .single()

    if (truckError || !truck) {
      console.error('❌ Error finding truck:', truckError?.message)
      return false
    }

    // Update truck with first image as main image_url
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[0].supabaseUrl : null

    const { error: updateError } = await supabase
      .from('trucks')
      .update({
        image_url: mainImageUrl
      })
      .eq('id', truck.id)

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      return false
    }

    console.log(`\n✅ Updated truck (ID: ${truck.id}) with main image`)
    console.log(`   Main image: ${mainImageUrl}`)
    console.log(`   Total images uploaded: ${imageUrls.length}`)
    
    return true
  } catch (error) {
    console.error('❌ Error updating truck:', error.message)
    return false
  }
}

async function uploadAllImages() {
  console.log('🚀 Starting to upload Tata 1412 LPT images to Supabase...\n')
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Storage folder: ${TRUCK_FOLDER_NAME}\n`)

  // Check if source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`)
    process.exit(1)
  }

  // Get all image files
  const imageFiles = await getAllImageFiles()
  
  if (imageFiles.length === 0) {
    console.error('❌ No image files found in source folder')
    process.exit(1)
  }

  console.log(`📸 Found ${imageFiles.length} image files to upload\n`)

  // Upload all images
  const uploadedImages = []
  let successCount = 0
  let errorCount = 0

  for (const file of imageFiles) {
    const result = await uploadImageToSupabase(file.path, file.name)
    if (result) {
      uploadedImages.push(result)
      successCount++
    } else {
      errorCount++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} images`)
  if (errorCount > 0) {
    console.log(`❌ Failed to upload: ${errorCount} images`)
  }
  console.log('='.repeat(60))

  // Save mapping file
  const mappingFile = path.join(__dirname, 'tata-1412-image-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedImages, null, 2))
  console.log(`\n💾 Saved image mapping to: ${mappingFile}`)

  // Update truck with images
  if (uploadedImages.length > 0) {
    console.log('\n🔄 Updating truck record in database...')
    await updateTruckWithImages(uploadedImages)
  }

  console.log('\n✨ All done!')
  console.log('\n💡 Next steps:')
  console.log('   1. The main image has been updated in the database')
  console.log('   2. All images are stored in Supabase Storage')
  console.log('   3. Update the truck details page to display all images from the mapping file')
  console.log(`   4. Image URLs are stored in: ${mappingFile}\n`)
}

// Run the upload
uploadAllImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
