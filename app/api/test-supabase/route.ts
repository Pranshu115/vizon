import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    
    const config = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
      keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing',
      nodeEnv: process.env.NODE_ENV,
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase environment variables are missing',
        config,
        hint: 'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel environment variables for Production environment'
      }, { status: 500 })
    }
    
    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Try to list buckets to test connection
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        config,
      }, { status: 500 })
    }
    
    // Check if truck-images bucket exists
    const truckImagesBucket = buckets?.find(b => b.name === 'truck-images')
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase is configured correctly',
      config,
      buckets: buckets?.map(b => b.name) || [],
      truckImagesBucketExists: !!truckImagesBucket,
      truckImagesBucketPublic: truckImagesBucket?.public || false,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: error?.message || String(error),
    }, { status: 500 })
  }
}
