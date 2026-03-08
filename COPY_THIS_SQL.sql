-- ============================================
-- COPY THIS ENTIRE FILE AND PASTE IN SUPABASE SQL EDITOR
-- ============================================
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New query"
-- 3. Copy everything below this line
-- 4. Paste into the SQL Editor
-- 5. Click "Run" button
-- ============================================

-- Create tables for Axxlerator application
-- This migration creates all tables based on the Prisma schema

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trucks table
CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  kilometers INTEGER NOT NULL,
  horsepower INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  subtitle TEXT,
  certified BOOLEAN DEFAULT true,
  state VARCHAR(255),
  location VARCHAR(255),
  city VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valuation requests table
CREATE TABLE IF NOT EXISTS valuation_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  truck_manufacturer VARCHAR(255) NOT NULL,
  truck_model VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  kilometers INTEGER NOT NULL,
  condition VARCHAR(255) NOT NULL,
  additional_info TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truck inquiries table
CREATE TABLE IF NOT EXISTS truck_inquiries (
  id SERIAL PRIMARY KEY,
  truck_id INTEGER NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  truck_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  message TEXT,
  inquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id SERIAL PRIMARY KEY,
  query VARCHAR(255) NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truck submissions table
CREATE TABLE IF NOT EXISTS truck_submissions (
  id SERIAL PRIMARY KEY,
  seller_name VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  seller_phone VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  registration_number VARCHAR(255),
  kilometers INTEGER NOT NULL,
  fuel_type VARCHAR(255) NOT NULL,
  transmission VARCHAR(255) NOT NULL,
  horsepower INTEGER,
  engine_capacity VARCHAR(255),
  condition VARCHAR(255) NOT NULL,
  owner_number INTEGER NOT NULL,
  asking_price DECIMAL(10, 2) NOT NULL,
  negotiable BOOLEAN DEFAULT true,
  location VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  features TEXT,
  description TEXT,
  images TEXT NOT NULL,
  status VARCHAR(255) DEFAULT 'pending',
  certified BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(255) NOT NULL,
  otp TEXT NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trucks_certified ON trucks(certified);
CREATE INDEX IF NOT EXISTS idx_trucks_created_at ON trucks(created_at);
CREATE INDEX IF NOT EXISTS idx_truck_inquiries_truck_id ON truck_inquiries(truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_submissions_status ON truck_submissions(status);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_purpose_verified ON otp_verifications(phone, purpose, verified);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for trucks table
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ If you see "Success. No rows returned" - You're done!
-- ============================================

