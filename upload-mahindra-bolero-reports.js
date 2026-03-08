// Script to upload all PDF reports for Mahindra Bolero Maxitruck Plus
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
const TRUCK_FOLDER_NAME = 'MAHINDRA_BOLERO_MAXITRUCK_PLUS/REPORTS'
const SOURCE_FOLDER = path.join(__dirname, 'Mahindra Bolero Maxitruck Plus')

// Report files to upload
const REPORT_FILES = [
  'Copy of Legal Report DL1LAH4925.pdf',
  'Copy of VEHICLE INSPECTION REPORT DL1LAH4925.pdf',
  'WEB REPORT DL1LAH4925.pdf'
]

async function uploadPDFToSupabase(filePath, fileName) {
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
        contentType: 'application/pdf',
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

async function uploadAllReports() {
  console.log('🚀 Starting to upload Mahindra Bolero Maxitruck Plus reports to Supabase...\n')
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Storage folder: ${TRUCK_FOLDER_NAME}\n`)

  // Check if source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`)
    process.exit(1)
  }

  // Upload all reports
  const uploadedReports = []
  let successCount = 0
  let errorCount = 0

  for (const fileName of REPORT_FILES) {
    const filePath = path.join(SOURCE_FOLDER, fileName)
    
    if (!fs.existsSync(filePath)) {
      console.error(`⚠️  File not found: ${fileName}`)
      errorCount++
      continue
    }

    const result = await uploadPDFToSupabase(filePath, fileName)
    if (result) {
      uploadedReports.push(result)
      successCount++
    } else {
      errorCount++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Upload Summary:')
  console.log(`✅ Successfully uploaded: ${successCount} reports`)
  if (errorCount > 0) {
    console.log(`❌ Failed to upload: ${errorCount} reports`)
  }
  console.log('='.repeat(60))

  // Save mapping file
  const mappingFile = path.join(__dirname, 'mahindra-bolero-reports-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedReports, null, 2))
  console.log(`\n💾 Saved report mapping to: ${mappingFile}`)

  console.log('\n✨ All done!')
  console.log('\n💡 Next steps:')
  console.log('   1. Update the truck details page to display these reports')
  console.log(`   2. Report URLs are stored in: ${mappingFile}\n`)
}

// Run the upload
uploadAllReports()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
