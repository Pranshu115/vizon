-- Add report URL columns to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS legal_report_url TEXT,
ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;

-- Update ASHOK LEYLAND ECOMET STAR 1615 HE truck with report URLs
UPDATE trucks 
SET 
  legal_report_url = 'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/REPORTS/1771053005474-Copy%20of%20Legal%20Report%20UP14LT9003.pdf',
  inspection_report_url = 'https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/REPORTS/1771053006348-VEHICLE%20INSPECTION%20REPORT%20UP14LT9003.pdf'
WHERE name = 'ASHOK LEYLAND ECOMET STAR 1615 HE';
