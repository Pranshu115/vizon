// Script to upload Tata 609g PDF reports to Supabase Storage
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
const TRUCK_FOLDER_NAME = 'TATA_609G/REPORTS'
const SOURCE_FOLDER = path.join(__dirname, 'Tata 609g ')

// Report files to upload
const REPORT_FILES = [
  'Copy of Legal Report DL1LAH3656.pdf',
  'Copy of VEHICLE INSPECTION REPORT DL1LAH3656.pdf'
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

async function updateTruckWithReports(reports) {
  try {
    // Get the truck ID - using exact name variations
    const nameVariations = [
      'Tata 609g',
      'TATA 609G',
      'Tata Motors 609g',
      'Tata 609 g',
      'TATA 609 G',
      'Tata 609 G'
    ]
    
    let truck = null
    for (const name of nameVariations) {
      const { data: truckData, error: truckError } = await supabase
        .from('trucks')
        .select('id')
        .eq('name', name)
        .single()

      if (!truckError && truckData) {
        truck = truckData
        console.log(`✅ Found truck: "${name}" (ID: ${truck.id})`)
        break
      }
    }

    if (!truck) {
      console.error('❌ Error finding truck')
      console.error('   Note: Truck may not exist in database yet. Skipping database update.')
      console.error('   Reports uploaded successfully, but database update failed.')
      console.error('   Report URLs:')
      reports.forEach(r => {
        console.error(`   - ${r.originalName}: ${r.supabaseUrl}`)
      })
      return false
    }

    // Find legal report and inspection report
    const legalReport = reports.find(r => r.originalName.includes('Legal Report'))
    const inspectionReport = reports.find(r => r.originalName.includes('VEHICLE INSPECTION') || r.originalName.includes('INSPECTION REPORT'))

    // Update truck with report URLs
    const updateData = {}
    if (legalReport) {
      updateData.legal_report_url = legalReport.supabaseUrl
    }
    if (inspectionReport) {
      updateData.inspection_report_url = inspectionReport.supabaseUrl
    }

    // If columns don't exist, we'll need to add them first
    // For now, let's try to update and see if it works
    const { error: updateError } = await supabase
      .from('trucks')
      .update(updateData)
      .eq('id', truck.id)

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      console.error('   This might mean the columns need to be added to the database first.')
      console.error('   Reports uploaded successfully, but database update failed.')
      console.error('   Report URLs:')
      reports.forEach(r => {
        console.error(`   - ${r.originalName}: ${r.supabaseUrl}`)
      })
      return false
    }

    console.log(`\n✅ Updated truck (ID: ${truck.id}) with report URLs`)
    if (legalReport) {
      console.log(`   Legal Report: ${legalReport.supabaseUrl}`)
    }
    if (inspectionReport) {
      console.log(`   Inspection Report: ${inspectionReport.supabaseUrl}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error updating truck:', error.message)
    return false
  }
}

async function uploadAllReports() {
  console.log('🚀 Starting to upload Tata 609g reports to Supabase...\n')
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
  const mappingFile = path.join(__dirname, 'tata-609g-reports-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadedReports, null, 2))
  console.log(`\n💾 Saved report mapping to: ${mappingFile}`)

  // Update truck with reports
  if (uploadedReports.length > 0) {
    console.log('\n🔄 Updating truck record in database...')
    await updateTruckWithReports(uploadedReports)
  }

  console.log('\n✨ All done!')
  console.log('\n💡 Next steps:')
  console.log('   1. If database update failed, you may need to add columns to the trucks table:')
  console.log('      - legal_report_url TEXT')
  console.log('      - inspection_report_url TEXT')
  console.log('   2. Copy the mapping file to public folder:')
  console.log('      cp tata-609g-reports-mapping.json public/')
  console.log('   3. Update the truck details page to display these reports in the Quality Report section.\n')
}

// Run the upload
uploadAllReports()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
