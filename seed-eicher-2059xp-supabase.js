// Add Eicher Pro 2059 XP trucks to Supabase (does not delete existing trucks)
// Run: node seed-eicher-2059xp-supabase.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load .env.local or .env
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found. Set in .env or .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Single Eicher 2059 XP (72,154 km only)
const eicher2059xpTrucks = [
  {
    name: 'Eicher Pro 2059 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2059 XP',
    year: 2022,
    kilometers: 72154,
    horsepower: 59,
    price: 630000,
    image_url: '/trucks/truck21-image-1.png',
    subtitle: 'Extended power variant.',
    certified: true,
  },
];

async function addEicher2059XP() {
  console.log('🔍 Checking if Eicher Pro 2059 XP already exists in Supabase...');
  const { data: existing } = await supabase
    .from('trucks')
    .select('id, name')
    .ilike('name', '%2059%');

  if (existing && existing.length > 0) {
    console.log(`✅ Found ${existing.length} Eicher 2059 XP truck(s) already in database.`);
    console.log('   IDs:', existing.map((t) => t.id).join(', '));
    console.log('\n💡 No insert needed. Refresh your website to see them.');
    return;
  }

  console.log('📥 Adding Eicher Pro 2059 XP trucks...\n');
  let success = 0;
  let failed = 0;

  for (const truck of eicher2059xpTrucks) {
    const { data, error } = await supabase.from('trucks').insert(truck).select('id');
    if (error) {
      console.error(`❌ ${truck.name} (${truck.year}):`, error.message);
      failed++;
    } else {
      console.log(`✅ Inserted: ${truck.name} (${truck.year}) — ID ${data[0].id}`);
      success++;
    }
  }

  console.log('\n' + '—'.repeat(50));
  console.log(`✅ Inserted: ${success} | ❌ Failed: ${failed}`);
  if (success > 0) {
    console.log('\n🎉 Eicher 2059 XP trucks are now in Supabase. Refresh your website to see them.');
  }
}

addEicher2059XP()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
