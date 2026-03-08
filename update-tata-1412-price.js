require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found!')
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set in .env.local or .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePrice() {
  console.log('🔄 Updating price for Tata 1412 LPT...\n')

  try {
    // Find the truck
    const { data: truck, error: fetchError } = await supabase
      .from('trucks')
      .select('id, name, price')
      .eq('name', 'Tata 1412 LPT')
      .single()

    if (fetchError) {
      console.error('❌ Error finding truck:', fetchError.message)
      return
    }

    if (!truck) {
      console.error('❌ Truck not found in database')
      return
    }

    console.log('📊 Current Details:')
    console.log(`   ID: ${truck.id}`)
    console.log(`   Name: ${truck.name}`)
    console.log(`   Current Price: ₹${Number(truck.price).toLocaleString('en-IN')}`)
    console.log('')

    // Update price to 13.40 Lakhs (₹13,40,000)
    const newPrice = 1340000

    const { data: updatedTruck, error: updateError } = await supabase
      .from('trucks')
      .update({ price: newPrice })
      .eq('id', truck.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating price:', updateError.message)
      return
    }

    console.log('✅ Price updated successfully!')
    console.log('')
    console.log('📊 Updated Details:')
    console.log(`   ID: ${updatedTruck.id}`)
    console.log(`   Name: ${updatedTruck.name}`)
    console.log(`   New Price: ₹${Number(updatedTruck.price).toLocaleString('en-IN')}`)
    console.log('')
    console.log('✅ The price has been updated in the database!')
    console.log('   The new price will be visible on the website after the next page load.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updatePrice()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
