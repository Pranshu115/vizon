-- Add all truck detail columns to trucks table
-- Run this in Supabase SQL Editor

ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS rto VARCHAR(100),
ADD COLUMN IF NOT EXISTS insurance_date DATE,
ADD COLUMN IF NOT EXISTS transmission VARCHAR(50),
ADD COLUMN IF NOT EXISTS payload_capacity_net VARCHAR(255),
ADD COLUMN IF NOT EXISTS payload_capacity_gross VARCHAR(255),
ADD COLUMN IF NOT EXISTS payload_capacity_ft VARCHAR(255),
ADD COLUMN IF NOT EXISTS gearbox VARCHAR(255),
ADD COLUMN IF NOT EXISTS ownership_number INTEGER,
ADD COLUMN IF NOT EXISTS tyres INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN trucks.fuel_type IS 'Fuel type: Diesel, Petrol, CNG, Electric';
COMMENT ON COLUMN trucks.rto IS 'Regional Transport Office location';
COMMENT ON COLUMN trucks.insurance_date IS 'Insurance expiry date';
COMMENT ON COLUMN trucks.transmission IS 'Transmission type: Manual, Automatic';
COMMENT ON COLUMN trucks.payload_capacity_net IS 'Net payload capacity';
COMMENT ON COLUMN trucks.payload_capacity_gross IS 'Gross payload capacity';
COMMENT ON COLUMN trucks.payload_capacity_ft IS 'Payload capacity in feet';
COMMENT ON COLUMN trucks.gearbox IS 'Gearbox specification';
COMMENT ON COLUMN trucks.ownership_number IS 'Number of previous owners';
COMMENT ON COLUMN trucks.tyres IS 'Number of tyres';