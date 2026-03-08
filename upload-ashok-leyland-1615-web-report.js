// Script to upload WEB REPORT UP14LT9003.pdf for ASHOK LEYLAND ECOMET STAR 1615 HE
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
const TRUCK_FOLDER_NAME = 'ASHOK_LEYLAND_ECOMET_STAR_1615_HE/REPORTS'
const SOURCE_FOLDER = path.join(__dirname, 'ASHOK LEYLAND ECOMET STAR 1615 HE')
const REPORT_FILE = 'WEB REPORT UP14LT9003.pdf'

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

async function uploadWebReport() {
  console.log('🚀 Starting to upload WEB REPORT for ASHOK LEYLAND ECOMET STAR 1615 HE...\n')
  console.log(`📁 Source folder: ${SOURCE_FOLDER}`)
  console.log(`📦 Bucket: ${BUCKET_NAME}`)
  console.log(`📂 Storage folder: ${TRUCK_FOLDER_NAME}\n`)

  // Check if source folder exists
  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`❌ Source folder not found: ${SOURCE_FOLDER}`)
    process.exit(1)
  }

  const filePath = path.join(SOURCE_FOLDER, REPORT_FILE)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${REPORT_FILE}`)
    process.exit(1)
  }

  // Upload the report
  const result = await uploadPDFToSupabase(filePath, REPORT_FILE)

  if (result) {
    console.log('\n' + '='.repeat(60))
    console.log('✅ Successfully uploaded WEB REPORT!')
    console.log('='.repeat(60))
    console.log(`\n📄 Report URL:`)
    console.log(`   ${result.supabaseUrl}\n`)
    
    // Update the mapping file
    const mappingFile = path.join(__dirname, 'ashok-leyland-1615-reports-mapping.json')
    let reports = []
    if (fs.existsSync(mappingFile)) {
      reports = JSON.parse(fs.readFileSync(mappingFile, 'utf8'))
    }
    reports.push(result)
    fs.writeFileSync(mappingFile, JSON.stringify(reports, null, 2))
    console.log(`💾 Updated mapping file: ${mappingFile}`)
  } else {
    console.error('\n❌ Failed to upload WEB REPORT')
    process.exit(1)
  }

  console.log('\n✨ All done!')
  console.log('\n💡 Next step:')
  console.log('   Update the truck details page to include this report in the Quality Reports section.\n')
}

// Run the upload
uploadWebReport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
