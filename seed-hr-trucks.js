// Seed 8 new HR trucks using Supabase image URLs from WhatsApp folders
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

// One representative image per folder (front/exterior shot)
// Pulled from whatsapp-upload-mapping.json (first image entry for each folder)
const trucks = [
  {
    name: 'HR 38 W 2162',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_38_W_2162/1766136466662-WhatsApp_Image_2025-12-17_at_6.33.50_PM.jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 38 W 2162',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 38 W 2263',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_38_W_2263/1766136482760-WhatsApp_Image_2025-12-17_at_6.44.37_PM.jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 38 W 2263',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 38 W 3426',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_38_W_3426/1766136495219-WhatsApp_Image_2025-12-17_at_6.29.11_PM.jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 38 W 3426',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 55 X 0025',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_55_X_0025/1766136509027-WhatsApp_Image_2025-12-17_at_6.39.46_PM_(1).jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 55 X 0025',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 55 X 0253',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_55_X_0253/1766136519386-WhatsApp_Image_2025-12-17_at_6.51.02_PM.jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 55 X 0253',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 55 X 1147',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_55_X_1147/1766136532086-WhatsApp_Image_2025-12-17_at_6.15.12_PM_(1).jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 55 X 1147',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 55 X 2071',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_55_X_2071/1766136554735-WhatsApp_Image_2025-12-17_at_6.01.40_PM_(1).jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 55 X 2071',
    city: 'TBD',
    state: 'Haryana'
  },
  {
    name: 'HR 55 X 4498',
    manufacturer: 'TBD',
    model: 'TBD',
    year: 2024,
    kilometers: 0,
    horsepower: 0,
    price: 500000,
    image_url:
      'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/HR_55_X_4498/1766136582714-WhatsApp_Image_2025-12-17_at_6.22.57_PM.jpeg',
    subtitle: 'Details coming soon.',
    certified: true,
    location: 'HR 55 X 4498',
    city: 'TBD',
    state: 'Haryana'
  }
]

async function seedHrTrucks() {
  console.log('🌱 Inserting 8 HR WhatsApp trucks (images only)...\n')

  let successCount = 0
  let errorCount = 0

  for (const truck of trucks) {
    const { data, error } = await supabase.from('trucks').insert(truck).select()

    if (error) {
      console.error(`❌ Error inserting ${truck.name}:`, error.message)
      errorCount++
    } else {
      console.log(`✅ Inserted: ${truck.name} (ID: ${data[0].id})`)
      successCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 HR Trucks Seeding Summary:')
  console.log(`✅ Successfully inserted: ${successCount} trucks`)
  if (errorCount > 0) {
    console.log(`❌ Failed to insert: ${errorCount} trucks`)
  }
  console.log('='.repeat(50))
}

seedHrTrucks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })


