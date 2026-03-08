/**
 * Set Tata 709g LPT as certified so it appears on the browse/listing page.
 * The /api/trucks endpoint only returns trucks where certified = true.
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const NAME_VARIATIONS = [
  'Tata 709g LPT',
  'Tata 709 G LPT',
  'TATA 709G LPT',
  'TATA 709 G LPT',
  'Tata Motors 709g LPT',
  'Tata 709 g LPT',
]

async function setCertified() {
  console.log('🔍 Looking for Tata 709g LPT in Supabase...\n')

  for (const name of NAME_VARIATIONS) {
    const { data: truck, error } = await supabase
      .from('trucks')
      .select('id, name, certified')
      .eq('name', name)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error(`   Error checking "${name}":`, error.message)
      continue
    }

    if (truck) {
      console.log(`✅ Found: "${truck.name}" (ID: ${truck.id}, certified: ${truck.certified})\n`)

      if (truck.certified === true) {
        console.log('   Truck is already certified. It should appear on the browse page.')
        console.log('   If it still does not appear, check: limit=500 on /api/trucks and filters on the browse page.\n')
        return
      }

      const { error: updateError } = await supabase
        .from('trucks')
        .update({ certified: true })
        .eq('id', truck.id)

      if (updateError) {
        console.error('❌ Failed to update certified:', updateError.message)
        process.exit(1)
      }

      console.log('✅ Updated certified = true. Tata 709g LPT should now appear on the browse page.\n')
      return
    }
  }

  // Fallback: find by name containing 709 and LPT
  const { data: trucks, error } = await supabase
    .from('trucks')
    .select('id, name, certified')
    .ilike('name', '%709%')
    .ilike('name', '%lpt%')

  if (!error && trucks && trucks.length > 0) {
    console.log('   Found truck(s) with 709 and LPT in name:\n')
    trucks.forEach(t => console.log(`   - ID ${t.id}: "${t.name}" (certified: ${t.certified})`))
    console.log('\n   Update manually in Supabase: set certified = true for the correct row.')
  } else {
    console.error('❌ Tata 709g LPT not found in Supabase.')
    console.error('   Ensure the truck exists in the "trucks" table and name matches one of:', NAME_VARIATIONS.join(', '))
  }
}

setCertified().catch(err => {
  console.error(err)
  process.exit(1)
})
