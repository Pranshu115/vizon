// Script to update Tata 1109g LPT truck with report URLs in database
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

async function updateDatabase() {
  console.log('🚀 Starting to update Tata 1109g LPT truck with report URLs in database...\n')

  try {
    // First, try to add columns if they don't exist
    console.log('📝 Adding columns to trucks table (if they don\'t exist)...')
    try {
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE trucks 
          ADD COLUMN IF NOT EXISTS legal_report_url TEXT,
          ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
        `
      })

      if (alterError) {
        console.log('⚠️  RPC method not available, columns may need to be added manually')
        console.log('   Please run this SQL in Supabase dashboard SQL Editor:')
        console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS legal_report_url TEXT;')
        console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;')
        console.log('   Then run this script again.\n')
      } else {
        console.log('✅ Columns added successfully (or already exist)\n')
      }
    } catch (rpcError) {
      console.log('⚠️  Could not add columns via RPC, they may need to be added manually')
      console.log('   Please run this SQL in Supabase dashboard SQL Editor:')
      console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS legal_report_url TEXT;')
      console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;')
      console.log('   Then run this script again.\n')
    }

    // Read the reports mapping file
    const mappingFile = path.join(__dirname, 'tata-1109g-reports-mapping.json')
    if (!fs.existsSync(mappingFile)) {
      console.error(`❌ Reports mapping file not found: ${mappingFile}`)
      console.error('   Please run upload-tata-1109g-reports.js first to upload the reports.')
      process.exit(1)
    }

    const reports = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'))
    console.log(`📋 Loaded ${reports.length} reports from mapping file\n`)

    // Find legal report and inspection report
    const legalReport = reports.find(r => 
      r.originalName.includes('Legal Report') || 
      r.originalName.toLowerCase().includes('legal')
    )
    const inspectionReport = reports.find(r => 
      r.originalName.includes('VEHICLE INSPECTION') || 
      r.originalName.includes('INSPECTION REPORT') ||
      r.originalName.toLowerCase().includes('inspection')
    )

    if (!legalReport && !inspectionReport) {
      console.error('❌ Error: Could not find Legal Report or Inspection Report in mapping file')
      console.error('   Available reports:')
      reports.forEach(r => console.error(`   - ${r.originalName}`))
      process.exit(1)
    }

    // Try to find the truck with various name variations
    const TRUCK_NAME_VARIATIONS = [
      'TATA MOTORS 1109G LPT',
      'Tata 1109g LPT',
      'Tata 1109 G LPT',
      'TATA 1109G LPT',
      'Tata Motors 1109g LPT',
    ]

    let truckId = null
    let foundTruckName = null

    for (const name of TRUCK_NAME_VARIATIONS) {
      const { data: truck, error: truckError } = await supabase
        .from('trucks')
        .select('id, name')
        .eq('name', name)
        .single()

      if (truckError && truckError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error(`❌ Error finding truck with name "${name}":`, truckError.message)
        continue
      }
      if (truck) {
        truckId = truck.id
        foundTruckName = truck.name
        console.log(`✅ Found truck "${foundTruckName}" with ID: ${truckId}`)
        break
      }
    }

    if (!truckId) {
      console.error('❌ Error: Truck "TATA MOTORS 1109G LPT" (or variations) not found in database.')
      console.error('   Please make sure the truck exists in the database first.')
      process.exit(1)
    }

    // Prepare update data
    const updateData = {}
    if (legalReport) {
      updateData.legal_report_url = legalReport.supabaseUrl
      console.log(`📄 Legal Report URL: ${legalReport.supabaseUrl}`)
    }
    if (inspectionReport) {
      updateData.inspection_report_url = inspectionReport.supabaseUrl
      console.log(`📄 Inspection Report URL: ${inspectionReport.supabaseUrl}`)
    }

    // Update truck with report URLs
    const { error: updateError } = await supabase
      .from('trucks')
      .update(updateData)
      .eq('id', truckId)

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      console.error('   This might mean the columns need to be added to the database first.')
      console.error('   Please run the SQL script: add-reports-columns.sql')
      console.error('   Or run this SQL in Supabase dashboard SQL Editor:')
      console.error('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS legal_report_url TEXT;')
      console.error('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;')
      process.exit(1)
    }

    console.log(`\n✅ Successfully updated truck (ID: ${truckId}, Name: "${foundTruckName}") with report URLs`)
    if (legalReport) {
      console.log(`   ✅ Legal Report: ${legalReport.supabaseUrl}`)
    }
    if (inspectionReport) {
      console.log(`   ✅ Inspection Report: ${inspectionReport.supabaseUrl}`)
    }
    
    console.log('\n✨ All done!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    throw error
  }
}

updateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
