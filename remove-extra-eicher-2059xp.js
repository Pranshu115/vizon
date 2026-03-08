// Keep only one Eicher 2059 XP (72,154 km) and remove the other 3 from Supabase
// Run: node remove-extra-eicher-2059xp.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found. Set in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const KEEP_KILOMETERS = 72154;

async function run() {
  console.log('🔍 Fetching all Eicher 2059 XP trucks...');
  const { data: trucks, error: fetchError } = await supabase
    .from('trucks')
    .select('id, name, kilometers, year, price')
    .ilike('name', '%2059%');

  if (fetchError) {
    console.error('❌ Fetch failed:', fetchError.message);
    process.exit(1);
  }

  if (!trucks || trucks.length === 0) {
    console.log('No Eicher 2059 XP trucks found.');
    return;
  }

  const toKeep = trucks.find((t) => Number(t.kilometers) === KEEP_KILOMETERS);
  const toRemove = trucks.filter((t) => Number(t.kilometers) !== KEEP_KILOMETERS);

  if (!toKeep) {
    console.log(`⚠️ No truck with ${KEEP_KILOMETERS.toLocaleString()} km found. Found:`);
    trucks.forEach((t) => console.log(`   ID ${t.id}: ${t.kilometers} km`));
    console.log('\nNothing deleted. Update KEEP_KILOMETERS in this script if needed.');
    return;
  }

  if (toRemove.length === 0) {
    console.log(`✅ Only one Eicher 2059 XP exists (ID ${toKeep.id}, ${KEEP_KILOMETERS.toLocaleString()} km). Nothing to remove.`);
    return;
  }

  console.log(`\n✅ Keeping: ID ${toKeep.id} — ${KEEP_KILOMETERS.toLocaleString()} km`);
  console.log(`🗑️  Removing ${toRemove.length} other(s):`);
  toRemove.forEach((t) => console.log(`   ID ${t.id} — ${t.kilometers} km`));

  for (const t of toRemove) {
    const { error: delError } = await supabase.from('trucks').delete().eq('id', t.id);
    if (delError) {
      console.error(`❌ Failed to delete ID ${t.id}:`, delError.message);
    } else {
      console.log(`   Deleted ID ${t.id}`);
    }
  }

  console.log('\n🎉 Done. Only one Eicher 2059 XP (72,154 km) remains.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
