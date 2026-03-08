// Script to check if Tata 609g truck exists in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTruck() {
  console.log('🔍 Checking for Tata 609g in database...\n')

  // Try different name variations
  const nameVariations = [
    'Tata 609g',
    'TATA 609G',
    'Tata Motors 609g',
    'Tata 609 g',
    'Tata 609 G',
    'TATA 609 G'
  ]

  for (const name of nameVariations) {
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .eq('name', name)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error checking "${name}":`, error.message)
        continue
      }

      if (data) {
        console.log(`✅ Truck found: "${name}"\n`)
        console.log('='.repeat(60))
        console.log('📊 Truck Details:')
        console.log('='.repeat(60))
        console.log(`   ID: ${data.id}`)
        console.log(`   Name: ${data.name}`)
        console.log(`   Manufacturer: ${data.manufacturer}`)
        console.log(`   Model: ${data.model}`)
        console.log(`   Year: ${data.year}`)
        console.log(`   Kilometers: ${data.kilometers?.toLocaleString('en-IN') || 'N/A'}`)
        console.log(`   Horsepower: ${data.horsepower} HP`)
        console.log(`   Price: ₹${Number(data.price).toLocaleString('en-IN')}`)
        console.log(`   Location: ${data.location || 'N/A'}`)
        console.log(`   State: ${data.state || 'N/A'}`)
        console.log(`   City: ${data.city || 'N/A'}`)
        console.log(`   Certified: ${data.certified ? 'Yes ✅' : 'No ❌'}`)
        console.log(`   Image URL: ${data.image_url || 'N/A'}`)
        console.log(`   Subtitle: ${data.subtitle || 'N/A'}`)
        console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`)
        console.log('='.repeat(60))
        
        if (!data.certified) {
          console.log('\n⚠️  WARNING: Truck is NOT certified!')
          console.log('   It will NOT appear in the browse trucks page.')
          console.log('   The browse page only shows certified trucks.')
        } else {
          console.log('\n✅ This truck should be visible in the "Browse Trucks" page!')
          console.log('   Visit: http://localhost:3000/browse-trucks\n')
        }
        
        return
      }
    } catch (error) {
      console.error(`❌ Error checking "${name}":`, error)
    }
  }

  console.log('❌ Truck not found in database with any of these names:')
  nameVariations.forEach(name => console.log(`   - ${name}`))
  console.log('\n💡 The truck may need to be added to the database first.')
}

checkTruck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
