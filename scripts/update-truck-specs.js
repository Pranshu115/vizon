// Update truck specifications in database with correct manufacturer, model, year, mileage, horsepower, and emission standards
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Truck specifications from the notes
const truckSpecs = {
  'HR 38 W 2162': {
    manufacturer: 'Tata',
    model: 'LPT 1412',
    year: 2017,
    kilometers: 83000,
    horsepower: 125,
    subtitle: 'BS4 • 83k KM • 125 HP'
  },
  'HR 38 W 2263': {
    manufacturer: 'Ashok',
    model: 'Ecomet 1214',
    year: 2017,
    kilometers: 76000,
    horsepower: 130,
    subtitle: 'Euro4 • 76k KM • 130 HP'
  },
  'HR 38 W 3426': {
    manufacturer: 'Tata',
    model: 'LPPT 1412',
    year: 2014,
    kilometers: 68000,
    horsepower: 125,
    subtitle: 'BS Euro3 • 68k KM • 125 HP'
  },
  'HR 55 X 0025': {
    manufacturer: 'Tata',
    model: 'LPT 2518c',
    year: 2016,
    kilometers: 87000,
    horsepower: 180,
    subtitle: 'BS6 • 87k KM • 180 HP'
  },
  'HR 55 X 0253': {
    manufacturer: 'Tata',
    model: 'LPT 2518c',
    year: 2014,
    kilometers: 70000,
    horsepower: 180,
    subtitle: 'BS4 • 70k KM • 180 HP'
  },
  'HR 55 X 1147': {
    manufacturer: 'Tata',
    model: 'LPT 2518c',
    year: 2016,
    kilometers: 65000,
    horsepower: 180,
    subtitle: 'BS4 • 65k KM • 180 HP'
  },
  'HR 55 X 2071': {
    manufacturer: 'Tata',
    model: 'LPT 2518c',
    year: 2016,
    kilometers: 80000,
    horsepower: 180,
    subtitle: 'BS4 • 80k KM • 180 HP'
  },
  'HR 55 X 4498': {
    manufacturer: 'Tata',
    model: 'LPT 2518c',
    year: 2016,
    kilometers: 78000,
    horsepower: 180,
    subtitle: 'BS4 • 78k KM • 180 HP'
  }
}

async function updateTruckSpecs() {
  console.log('🔄 Updating truck specifications in database...\n')

  let updatedCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (const [truckName, specs] of Object.entries(truckSpecs)) {
    // Find truck by name
    const { data: trucks, error: fetchError } = await supabase
      .from('trucks')
      .select('id, name')
      .eq('name', truckName)
      .limit(1)

    if (fetchError) {
      console.error(`❌ Error fetching ${truckName}:`, fetchError.message)
      errorCount++
      continue
    }

    if (!trucks || trucks.length === 0) {
      console.log(`⚠️  Not found: ${truckName}`)
      notFoundCount++
      continue
    }

    const truck = trucks[0]

    // Update truck with new specifications
    const { error: updateError } = await supabase
      .from('trucks')
      .update({
        manufacturer: specs.manufacturer,
        model: specs.model,
        year: specs.year,
        kilometers: specs.kilometers,
        horsepower: specs.horsepower,
        subtitle: specs.subtitle,
        location: 'Delhi',
        city: null,
        state: null
      })
      .eq('id', truck.id)

    if (updateError) {
      console.error(`❌ Error updating ${truckName}:`, updateError.message)
      errorCount++
    } else {
      console.log(`✅ Updated: ${truckName}`)
      console.log(`   Manufacturer: ${specs.manufacturer}`)
      console.log(`   Model: ${specs.model}`)
      console.log(`   Year: ${specs.year}`)
      console.log(`   Kilometers: ${specs.kilometers}`)
      console.log(`   Horsepower: ${specs.horsepower}`)
      console.log(`   Subtitle: ${specs.subtitle}`)
      console.log(`   Location: Delhi`)
      updatedCount++
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('\n📊 Update Summary:')
  console.log(`✅ Successfully updated: ${updatedCount} trucks`)
  if (notFoundCount > 0) {
    console.log(`⚠️  Not found: ${notFoundCount} trucks`)
  }
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} trucks`)
  }
  console.log('='.repeat(60))
}

updateTruckSpecs()
  .then(() => {
    console.log('\n✅ Database update completed!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
