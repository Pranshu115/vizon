// Script to remove old images and upload fresh Tata 1109g LPT images to Supabase Storage
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
const TRUCK_FOLDER_NAME = 'TATA_1109G_LPT'
const SOURCE_FOLDER = path.join(__dirname, 'Tata 1109g LPT')

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf'
  }
  return types[ext] || 'image/jpeg'
}

function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
}

function isVideoFile(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return ['.mp4', '.mov', '.avi', '.webm'].includes(ext)
}

async function deleteOldFiles() {
  console.log('🗑️  Removing old files from Supabase Storage...\n')
  
  try {
    // List all files in the folder
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(TRUCK_FOLDER_NAME, {
        limit: 1000,
        offset: 0
      })

    if (error) {
      console.warn('⚠️  Could not list old files (folder might not exist yet):', error.message)
      return 0
    }

    if (!files || files.length === 0) {
      console.log('✅ No old files to remove\n')
      return 0
    }

    console.log(`📋 Found ${files.length} old files to remove\n`)

    // Filter to only media files (images and videos)
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

    if (mediaFiles.length === 0) {
      console.log('✅ No old media files to remove\n')
      return 0
    }

    // Delete all old files
    const filesToDelete = mediaFiles.map(file => `${TRUCK_FOLDER_NAME}/${file.name}`)
    
    console.log(`🗑️  Deleting ${filesToDelete.length} old files...`)
    
    const { data: deletedFiles, error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete)

    if (deleteError) {
      console.error('❌ Error deleting old files:', deleteError.message)
      return 0
    }

    console.log(`✅ Successfully deleted ${deletedFiles?.length || filesToDelete.length} old files\n`)
    return deletedFiles?.length || filesToDelete.length
  } catch (error) {
    console.error('❌ Error removing old files:', error.message)
    return 0
  }
}

async function uploadFileToSupabase(filePath, fileName) {
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
      supabaseUrl: urlData.publicUrl,
      type: isImageFile(fileName) ? 'image' : isVideoFile(fileName) ? 'video' : 'other'
    }
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message)
    return null
  }
}

async function getAllMediaFiles() {
  try {
    const files = fs.readdirSync(SOURCE_FOLDER)
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        // Include images, videos, but exclude PDFs (they go in reports script)
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.avi', '.webm'].includes(ext)
      })
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
      .eq('name', 'Tata 1109g LPT')
      .single()

    if (truckError || !truck) {
      console.error('❌ Error finding truck:', truckError?.message)
      console.error('   Note: Truck may not exist in database yet. Skipping database update.')
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
    console.log(`   Total files uploaded: ${imageUrls.length}`)
    
    return true
  } catch (error) {
    console.error('❌ Error updating truck:', error.message)
    return false
  }
}

async function uploadAllMedia() {
  console.log('🚀 Starting fresh upload for Tata 1109g LPT...\n')
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Storage folder: ${TRUCK_FOLDER_NAME}\n`)

  // Check if source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`)
    process.exit(1)
  }

  // Step 1: Delete old files
  await deleteOldFiles()

  // Step 2: Get all media files
  const mediaFiles = await getAllMediaFiles()
  
  if (mediaFiles.length === 0) {
    console.error('❌ No image or video files found in source folder')
    process.exit(1)
  }

  console.log(`📸 Found ${mediaFiles.length} files to upload\n`)

  // Step 3: Upload all files
  const uploadedFiles = []
  let successCount = 0
  let errorCount = 0

  for (const file of mediaFiles) {
    const result = await uploadFileToSupabase(file.path, file.name)
    if (result) {
      uploadedFiles.push(result)
      successCount++
    } else {
      errorCount++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} files`)
  if (errorCount > 0) {
    console.log(`❌ Failed to upload: ${errorCount} files`)
  }
  console.log('='.repeat(60))

  // Step 4: Save mapping file
  const mappingFile = path.join(__dirname, 'tata-1109g-image-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedFiles, null, 2))
  console.log(`\n💾 Saved file mapping to: ${mappingFile}`)

  // Step 5: Update truck with images
  if (uploadedFiles.length > 0) {
    console.log('\n🔄 Updating truck record in database...')
    await updateTruckWithImages(uploadedFiles)
  }

  console.log('\n✨ All done!')
  console.log('\n💡 Next steps:')
  console.log('   1. Old images have been removed from Supabase Storage')
  console.log('   2. New images have been uploaded')
  console.log('   3. The main image has been updated in the database (if truck exists)')
  console.log('   4. All files are stored in Supabase Storage')
  console.log('   5. The mapping file has been updated with new URLs')
  console.log(`   6. File URLs are stored in: ${mappingFile}\n`)
}

// Run the upload
uploadAllMedia()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
