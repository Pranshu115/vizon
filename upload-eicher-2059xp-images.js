// Script to upload all Eicher 2059XP images and video to Supabase Storage
// NOTE: This is for "Eicher 2059XP" - NOT "Eicher Pro 2059XP" (they are different models)
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

// Use environment variables from user or fallback to .env files
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
const TRUCK_FOLDER_NAME = 'EICHER_2059XP' // Storage folder name in Supabase
// Find the source folder (it may have a trailing space)
const findSourceFolder = () => {
  try {
    const dirs = fs.readdirSync(__dirname).filter(f => {
      try {
        return fs.statSync(path.join(__dirname, f)).isDirectory() && 
               f.trim().toLowerCase() === 'eicher 2059xp'
      } catch {
        return false
      }
    })
    if (dirs.length > 0) {
      return path.join(__dirname, dirs[0])
    }
  } catch (e) {
    // Ignore
  }
  // Fallback to exact name with trailing space (as it appears in filesystem)
  return path.join(__dirname, 'Eicher 2059XP ')
}
const SOURCE_FOLDER = findSourceFolder() // Local folder name

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
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

async function uploadFileToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const timestamp = Date.now()
    const fileExtension = path.extname(fileName)
    const baseName = path.basename(fileName, fileExtension)
    
    // Create unique filename: timestamp-originalname.ext
    // Clean the filename to remove spaces and special characters for URL safety
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const uniqueFileName = `${TRUCK_FOLDER_NAME}/${timestamp}-${cleanBaseName}${fileExtension}`

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
        // Include images and videos, but exclude PDFs (they can be uploaded separately if needed)
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
    // Get the truck ID - using exact name "Eicher 2059XP"
    const { data: truck, error: truckError } = await supabase
      .from('trucks')
      .select('id')
      .eq('name', 'Eicher 2059XP')
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
  console.log('🚀 Starting to upload Eicher 2059XP images and video to Supabase...\n')
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Storage folder: ${TRUCK_FOLDER_NAME}\n`)
  console.log('⚠️  NOTE: This is for "Eicher 2059XP" - NOT "Eicher Pro 2059XP"\n')

  // Check if source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`)
    console.error(`   Please make sure the folder "Eicher 2059XP" exists in the project root`)
    process.exit(1)
  }

  // Get all media files
  const mediaFiles = await getAllMediaFiles()
  
  if (mediaFiles.length === 0) {
    console.error('❌ No image or video files found in source folder')
    process.exit(1)
  }

  console.log(`📸 Found ${mediaFiles.length} files to upload\n`)

  // Upload all files
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
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} files`)
  if (errorCount > 0) {
    console.log(`❌ Failed to upload: ${errorCount} files`)
  }
  console.log('='.repeat(60))

  // Save mapping file
  const mappingFile = path.join(__dirname, 'eicher-2059xp-image-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedFiles, null, 2))
  console.log(`\n💾 Saved file mapping to: ${mappingFile}`)

  // Update truck with images
  if (uploadedFiles.length > 0) {
    console.log('\n🔄 Updating truck record in database...')
    await updateTruckWithImages(uploadedFiles)
  }

  console.log('\n✨ All done!')
  console.log('\n💡 Next steps:')
  console.log('   1. The main image has been updated in the database (if truck exists)')
  console.log('   2. All files are stored in Supabase Storage')
  console.log('   3. Update the truck details page to display all files from the mapping file')
  console.log(`   4. File URLs are stored in: ${mappingFile}\n`)
}

// Run the upload
uploadAllMedia()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
