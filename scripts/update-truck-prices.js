// Script to update all truck prices in the database to be within 5-8 lacs range
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const root = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.local') });
require('dotenv').config({ path: path.join(root, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Price range: 5 lacs (500000) to 8 lacs (800000)
const MIN_PRICE = 500000;
const MAX_PRICE = 800000;
const RANGE = MAX_PRICE - MIN_PRICE; // 300000

// Price points for better distribution (in increments of 25k)
const PRICE_POINTS = [
  500000, 525000, 550000, 575000, 600000, 625000, 650000, 675000,
  700000, 725000, 750000, 775000, 800000
];

// Function to round to nearest price point
function roundToPricePoint(price) {
  return PRICE_POINTS.reduce((prev, curr) => 
    Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev
  );
}

// Function to adjust price to be within range with natural distribution
function adjustPrice(price, index = 0, totalCount = 1) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Distribute prices evenly across the range based on index
  // This ensures good variety across all price points
  const position = index / Math.max(1, totalCount - 1); // 0 to 1
  const targetPricePoint = Math.floor(position * (PRICE_POINTS.length - 1));
  
  if (isNaN(numPrice) || numPrice <= 0) {
    // Invalid price, use distributed price point
    return PRICE_POINTS[targetPricePoint];
  }
  
  // For valid prices, blend original price position with index-based distribution
  // This keeps some relation to original price while ensuring variety
  let targetIndex;
  
  if (numPrice < MIN_PRICE) {
    // Prices below 5 lacs: map to lower half of range (5-6.5 lacs)
    const ratio = numPrice / MIN_PRICE;
    const lowerHalfIndex = Math.floor(ratio * (PRICE_POINTS.length / 2));
    // Blend with index-based distribution for variety
    targetIndex = Math.floor((lowerHalfIndex + targetPricePoint) / 2);
  } else if (numPrice > MAX_PRICE) {
    // Prices above 8 lacs: map to upper half of range (6.5-8 lacs)
    const excessRatio = Math.min(1, (numPrice - MAX_PRICE) / (MAX_PRICE * 2));
    const upperHalfStart = Math.floor(PRICE_POINTS.length / 2);
    const upperHalfIndex = upperHalfStart + Math.floor(excessRatio * (PRICE_POINTS.length - upperHalfStart));
    // Blend with index-based distribution
    targetIndex = Math.floor((upperHalfIndex + targetPricePoint) / 2);
  } else {
    // Already in range: use index-based distribution but keep some relation to original
    const currentIndex = PRICE_POINTS.findIndex(p => Math.abs(p - numPrice) < 12500);
    if (currentIndex >= 0) {
      // Blend current position with distributed position
      targetIndex = Math.floor((currentIndex + targetPricePoint) / 2);
    } else {
      targetIndex = targetPricePoint;
    }
  }
  
  // Ensure index is within bounds
  targetIndex = Math.max(0, Math.min(PRICE_POINTS.length - 1, targetIndex));
  return PRICE_POINTS[targetIndex];
}

async function updateTruckPrices() {
  console.log('🔄 Starting to update truck prices in database...');
  console.log(`📊 Price range: ₹${MIN_PRICE.toLocaleString('en-IN')} - ₹${MAX_PRICE.toLocaleString('en-IN')}\n`);

  try {
    // Fetch all trucks
    const { data: trucks, error: fetchError } = await supabase
      .from('trucks')
      .select('id, name, price');

    if (fetchError) {
      console.error('❌ Error fetching trucks:', fetchError.message);
      process.exit(1);
    }

    if (!trucks || trucks.length === 0) {
      console.log('ℹ️  No trucks found in database.');
      process.exit(0);
    }

    console.log(`📦 Found ${trucks.length} trucks to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Update each truck's price to distribute across the range
    for (let index = 0; index < trucks.length; index++) {
      const truck = trucks[index];
      const currentPrice = typeof truck.price === 'string' ? parseFloat(truck.price) : truck.price;
      const adjustedPrice = adjustPrice(currentPrice, index, trucks.length);

      // Always update to redistribute prices across the range
      const { error: updateError } = await supabase
        .from('trucks')
        .update({ price: adjustedPrice })
        .eq('id', truck.id);

      if (updateError) {
        console.error(`❌ Error updating ${truck.name} (ID: ${truck.id}):`, updateError.message);
        errorCount++;
      } else {
        if (Math.abs(currentPrice - adjustedPrice) > 1000) {
          console.log(`✅ Updated ${truck.name}: ₹${currentPrice.toLocaleString('en-IN')} → ₹${adjustedPrice.toLocaleString('en-IN')}`);
        } else {
          console.log(`✓ ${truck.name}: ₹${adjustedPrice.toLocaleString('en-IN')}`);
        }
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Update Summary:');
    console.log(`✅ Processed: ${updatedCount} trucks`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} trucks`);
    }
    console.log('='.repeat(50));

    // Also update truck_submissions
    console.log('\n🔄 Updating truck submissions prices...\n');
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('truck_submissions')
      .select('id, registration_number, asking_price');

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError.message);
    } else if (submissions && submissions.length > 0) {
      let subUpdatedCount = 0;
      let subSkippedCount = 0;
      let subErrorCount = 0;

      for (let index = 0; index < submissions.length; index++) {
        const sub = submissions[index];
        const currentPrice = typeof sub.asking_price === 'string' ? parseFloat(sub.asking_price) : sub.asking_price;
        const adjustedPrice = adjustPrice(currentPrice, index, submissions.length);

        const { error: updateError } = await supabase
          .from('truck_submissions')
          .update({ asking_price: adjustedPrice })
          .eq('id', sub.id);

        if (updateError) {
          console.error(`❌ Error updating submission ${sub.id}:`, updateError.message);
          subErrorCount++;
        } else {
          const name = sub.registration_number || `Submission ${sub.id}`;
          if (Math.abs(currentPrice - adjustedPrice) > 1000) {
            console.log(`✅ Updated ${name}: ₹${currentPrice.toLocaleString('en-IN')} → ₹${adjustedPrice.toLocaleString('en-IN')}`);
          } else {
            console.log(`✓ ${name}: ₹${adjustedPrice.toLocaleString('en-IN')}`);
          }
          subUpdatedCount++;
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('📊 Submissions Update Summary:');
      console.log(`✅ Processed: ${subUpdatedCount} submissions`);
      if (subErrorCount > 0) {
        console.log(`❌ Errors: ${subErrorCount} submissions`);
      }
      console.log('='.repeat(50));
    }

    console.log('\n🎉 Price update completed!');
    console.log('👉 All truck prices are now within ₹5,00,000 - ₹8,00,000 range.');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

updateTruckPrices()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
