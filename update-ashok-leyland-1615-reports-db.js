// Script to update ASHOK LEYLAND ECOMET STAR 1615 HE truck with report URLs
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateDatabase() {
  console.log('🚀 Updating database for ASHOK LEYLAND ECOMET STAR 1615 HE reports...\n')

  try {
    // First, add columns if they don't exist
    console.log('📝 Adding columns to trucks table (if they don\'t exist)...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trucks 
        ADD COLUMN IF NOT EXISTS legal_report_url TEXT,
        ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
      `
    })

    if (alterError) {
      // If RPC doesn't work, try direct SQL (this might require admin access)
      console.log('⚠️  RPC method failed, trying alternative approach...')
      console.log('   Please run this SQL in Supabase dashboard:')
      console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS legal_report_url TEXT;')
      console.log('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;')
    } else {
      console.log('✅ Columns added successfully')
    }

    // Read the reports mapping
    const mappingFile = path.join(__dirname, 'ashok-leyland-1615-reports-mapping.json')
    if (!fs.existsSync(mappingFile)) {
      console.error('❌ Reports mapping file not found')
      return
    }

    const reports = JSON.parse(fs.readFileSync(mappingFile, 'utf8'))
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

    console.log('\n📥 Updating truck record...')
    const { data: truck, error: truckError } = await supabase
      .from('trucks')
      .select('id')
      .eq('name', 'ASHOK LEYLAND ECOMET STAR 1615 HE')
      .single()

    if (truckError || !truck) {
      console.error('❌ Error finding truck:', truckError?.message)
      return
    }

    const { error: updateError } = await supabase
      .from('trucks')
      .update(updateData)
      .eq('id', truck.id)

    if (updateError) {
      console.error('❌ Error updating truck:', updateError.message)
      console.error('\n💡 Please run this SQL in Supabase dashboard:')
      console.error('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS legal_report_url TEXT;')
      console.error('   ALTER TABLE trucks ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;')
      console.error('\n   Then run this update:')
      console.error(`   UPDATE trucks SET legal_report_url = '${legalReport?.supabaseUrl || ''}', inspection_report_url = '${inspectionReport?.supabaseUrl || ''}' WHERE id = ${truck.id};`)
      return
    }

    console.log('✅ Truck updated successfully!')
    console.log(`   Truck ID: ${truck.id}`)
    if (legalReport) {
      console.log(`   Legal Report: ${legalReport.supabaseUrl}`)
    }
    if (inspectionReport) {
      console.log(`   Inspection Report: ${inspectionReport.supabaseUrl}`)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
