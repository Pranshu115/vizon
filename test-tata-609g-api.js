// Test script to verify Tata 609g is returned by the API
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAPI() {
  console.log('🧪 Testing API for Tata 609g...\n')

  try {
    // Test 1: Check if truck exists and is certified
    console.log('1️⃣ Checking if truck exists and is certified...')
    const { data: truck, error: truckError } = await supabase
      .from('trucks')
      .select('*')
      .eq('name', 'Tata 609g')
      .eq('certified', true)
      .single()

    if (truckError) {
      console.error('❌ Error:', truckError.message)
      return
    }

    if (!truck) {
      console.error('❌ Truck not found or not certified!')
      return
    }

    console.log('✅ Truck found:')
    console.log(`   ID: ${truck.id}`)
    console.log(`   Name: ${truck.name}`)
    console.log(`   Price: ₹${Number(truck.price).toLocaleString('en-IN')}`)
    console.log(`   Certified: ${truck.certified}`)
    console.log(`   Created: ${new Date(truck.created_at).toLocaleString()}\n`)

    // Test 2: Check if truck appears in API response
    console.log('2️⃣ Checking if truck appears in API response (limit=500)...')
    const { data: trucks, error: apiError } = await supabase
      .from('trucks')
      .select('id, name, price, certified')
      .eq('certified', true)
      .order('created_at', { ascending: false })
      .limit(500)

    if (apiError) {
      console.error('❌ API Error:', apiError.message)
      return
    }

    console.log(`✅ API returned ${trucks.length} certified trucks`)
    const foundTruck = trucks.find(t => t.id === truck.id || t.name === 'Tata 609g')
    
    if (foundTruck) {
      console.log('✅ Tata 609g found in API response!')
      console.log(`   Position: ${trucks.indexOf(foundTruck) + 1} of ${trucks.length}`)
    } else {
      console.log('❌ Tata 609g NOT found in API response!')
      console.log('   First 10 trucks:', trucks.slice(0, 10).map(t => t.name))
    }

    // Test 3: Check price filter
    console.log('\n3️⃣ Testing price filter...')
    const priceInRupees = Number(truck.price)
    const priceMin = 50000
    const priceMax = 7000000
    const passesPriceFilter = priceInRupees >= priceMin && priceInRupees <= priceMax
    
    console.log(`   Price: ₹${priceInRupees.toLocaleString('en-IN')}`)
    console.log(`   Range: ₹${priceMin.toLocaleString('en-IN')} - ₹${priceMax.toLocaleString('en-IN')}`)
    console.log(`   Passes filter: ${passesPriceFilter ? '✅ Yes' : '❌ No'}`)

    // Test 4: Check image API
    console.log('\n4️⃣ Testing image API...')
    const imageApiUrl = `/api/truck-images?truckName=${encodeURIComponent('Tata 609g')}`
    console.log(`   URL: ${imageApiUrl}`)
    console.log('   (This would need to be tested from the browser)')

    console.log('\n✅ All tests completed!')
    console.log('\n💡 If truck is not visible:')
    console.log('   1. Clear browser cache and refresh')
    console.log('   2. Check browser console for errors')
    console.log('   3. Verify no filters are applied on browse page')
    console.log('   4. Check if truck appears when searching for "Tata 609g"\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
