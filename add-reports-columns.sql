-- Add report URL columns to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS legal_report_url TEXT,
ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
