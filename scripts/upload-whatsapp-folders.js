const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  console.error('   Make sure you have:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)')
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

// Folders provided by the user containing WhatsApp images/videos
const HR_FOLDERS = [
  'HR 38 W 2162',
  'HR 38 W 2263',
  'HR 38 W 3426',
  'HR 55 X 0025',
  'HR 55 X 0253',
  'HR 55 X 1147',
  'HR 55 X 2071',
  'HR 55 X 4498'
]

const PROJECT_ROOT = path.join(__dirname, '..')

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const VIDEO_EXTENSIONS = ['.mp4']

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  if (IMAGE_EXTENSIONS.includes(ext)) {
    // ext like .jpg -> image/jpg, .jpeg -> image/jpeg, .png -> image/png
    const subtype = ext.replace('.', '').toLowerCase()
    return `image/${subtype === 'jpg' ? 'jpeg' : subtype}`
  }
  if (VIDEO_EXTENSIONS.includes(ext)) {
    if (ext === '.mp4') return 'video/mp4'
  }
  return 'application/octet-stream'
}

function isSupportedMediaFile(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext)
}

function getAllMediaFilesInFolder(folderPath, folderLabel) {
  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠️  Folder not found, skipping: ${folderPath}`)
    return []
  }

  const entries = fs.readdirSync(folderPath)
  return entries
    .filter((name) => isSupportedMediaFile(name))
    .map((name) => ({
      name,
      folderLabel,
      fullPath: path.join(folderPath, name)
    }))
}

async function uploadFileToSupabase(file) {
  try {
    const fileBuffer = fs.readFileSync(file.fullPath)
    const ext = path.extname(file.name)
    const baseName = path.basename(file.name, ext)

    const timestamp = Date.now()

    // Keep files grouped in the bucket by HR folder
    const safeFolder = file.folderLabel.replace(/\s+/g, '_')
    const safeBase = baseName.replace(/\s+/g, '_')
    const objectKey = `${safeFolder}/${timestamp}-${safeBase}${ext}`

    const contentType = getContentType(file.name)

    console.log(`📤 Uploading [${file.folderLabel}]: ${file.name} → ${objectKey}`)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectKey, fileBuffer, {
        contentType,
        upsert: false
      })

    if (uploadError) {
      console.error(`❌ Error uploading ${file.name}:`, uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(objectKey)

    console.log(`✅ Uploaded: ${file.name}`)
    console.log(`   URL: ${urlData.publicUrl}`)

    return {
      folder: file.folderLabel,
      originalName: file.name,
      supabaseObjectKey: objectKey,
      supabaseUrl: urlData.publicUrl
    }
  } catch (err) {
    console.error(`❌ Error processing ${file.name}:`, err.message)
    return null
  }
}

async function main() {
  console.log('🚀 Starting WhatsApp HR folders upload to Supabase Storage...\n')

  const allFiles = []

  for (const folder of HR_FOLDERS) {
    const folderPath = path.join(PROJECT_ROOT, folder)
    console.log(`📁 Scanning folder: ${folderPath}`)
    const mediaFiles = getAllMediaFilesInFolder(folderPath, folder)
    console.log(`   → Found ${mediaFiles.length} media files`)
    allFiles.push(...mediaFiles)
  }

  if (allFiles.length === 0) {
    console.log('\n⚠️  No media files found in any HR folder. Nothing to upload.')
    return
  }

  console.log('\n📊 Total media files to upload:', allFiles.length)
  console.log('='.repeat(60))

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const file of allFiles) {
    const result = await uploadFileToSupabase(file)
    if (result) {
      results.push(result)
      successCount++
    } else {
      errorCount++
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('\n📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} files`)
  console.log(`❌ Failed to upload: ${errorCount} files`)

  const mappingFile = path.join(PROJECT_ROOT, 'whatsapp-upload-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(results, null, 2))
  console.log(`\n💾 WhatsApp upload mapping saved to: ${mappingFile}`)
  console.log('\n🎯 You can now use these Supabase URLs directly in your app.')
}

main()
  .then(() => {
    console.log('\n✅ WhatsApp HR folders upload process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })


