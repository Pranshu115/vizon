import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const BUCKET_NAME = 'truck-images'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!supabaseUrl) return null
  // Prefer service role so Storage list() works when bucket RLS restricts anon
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (serviceKey) return createClient(supabaseUrl, serviceKey)
  if (anonKey) return createClient(supabaseUrl, anonKey)
  return null
}

// Helper function to load images from mapping file
async function loadImagesFromMapping(truckName: string): Promise<string[]> {
  // Map truck names to their mapping file names (without path)
  const mappingFileNames: Record<string, string> = {
    'Tata 1109g LPT': 'tata-1109g-image-mapping.json',
    'TATA MOTORS 1109G LPT': 'tata-1109g-image-mapping.json',
    'Tata Motors 1109g LPT': 'tata-1109g-image-mapping.json',
    'TATA 1109G LPT': 'tata-1109g-image-mapping.json',
    'Tata 1412 LPT': 'tata-1412-image-mapping.json',
    'ASHOK LEYLAND ECOMET STAR 1415 HE': 'ashok-leyland-image-mapping.json',
    'ASHOK LEYLAND ECOMET STAR 1615 HE': 'ashok-leyland-1615-image-mapping.json',
    'Mahindra Bolero Maxitruck Plus': 'mahindra-bolero-image-mapping.json',
    'SML Isuzu Samrat 4760gs': 'sml-isuzu-image-mapping.json',
    'Tata 609g': 'tata-609g-image-mapping.json',
    'TATA 609G': 'tata-609g-image-mapping.json',
    'Tata Motors 609g': 'tata-609g-image-mapping.json',
    'Tata 609 g': 'tata-609g-image-mapping.json',
    'TATA 609 G': 'tata-609g-image-mapping.json',
    'Tata 609 G': 'tata-609g-image-mapping.json',
    'Tata 709g LPT': 'tata-709g-lpt-image-mapping.json',
    'TATA 709G LPT': 'tata-709g-lpt-image-mapping.json',
    'Tata Motors 709g LPT': 'tata-709g-lpt-image-mapping.json',
    'Tata 709 g LPT': 'tata-709g-lpt-image-mapping.json',
    'Tata 709 G LPT': 'tata-709g-lpt-image-mapping.json',
    'TATA 709 G LPT': 'tata-709g-lpt-image-mapping.json',
    'EICHER PRO 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
    'Eicher Pro 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
    'Eicher Motors Pro 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
    'Eicher 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
    'Eicher 2059': 'eicher-2059xp-image-mapping.json',
    'EICHER 2059': 'eicher-2059xp-image-mapping.json',
    'Eicher Motors 2059': 'eicher-2059xp-image-mapping.json',
    'Eicher 2059XP': 'eicher-2059xp-image-mapping.json',
    'EICHER 2059XP': 'eicher-2059xp-image-mapping.json',
    'Eicher Motors 2059XP': 'eicher-2059xp-image-mapping.json',
    'Eicher Pro 2059XP': 'eicher-2059xp-image-mapping.json',
    'EICHER PRO 2059XP': 'eicher-2059xp-image-mapping.json',
    'Eicher Pro 2059': 'eicher-2059xp-image-mapping.json',
    'EICHER PRO 2059': 'eicher-2059xp-image-mapping.json',
  }
  
  // Try to get the mapping file name
  let fileName = mappingFileNames[truckName]
  
  // Fallback matching for variations
  if (!fileName) {
    const normalizedName = truckName.toLowerCase()
    if (normalizedName.includes('1109') && normalizedName.includes('lpt')) {
      fileName = 'tata-1109g-image-mapping.json'
    } else if ((normalizedName.includes('609g') || normalizedName.includes('609 g')) && normalizedName.includes('tata')) {
      fileName = 'tata-609g-image-mapping.json'
    } else if ((normalizedName.includes('709g') || normalizedName.includes('709 g')) && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
      fileName = 'tata-709g-lpt-image-mapping.json'
    } else if (normalizedName.includes('1075') && normalizedName.includes('hsd') && normalizedName.includes('eicher')) {
      fileName = 'eicher-pro-1075-f-hsd-image-mapping.json'
    } else if (normalizedName.includes('2059') && normalizedName.includes('eicher')) {
      fileName = 'eicher-2059xp-image-mapping.json'
    }
  }
  
  if (!fileName) {
    return []
  }
  
  // Try multiple approaches:
  // 1. Read from file system (works in dev and if files are included in build)
  // 2. Fetch from public URL (works in production)
  const possiblePaths = [
    join(process.cwd(), fileName), // Root directory
    join(process.cwd(), 'public', fileName), // Public folder
  ]
  
  // Try file system first
  for (const mappingFile of possiblePaths) {
    if (existsSync(mappingFile)) {
      try {
        const fileContent = readFileSync(mappingFile, 'utf-8')
        const mapping = JSON.parse(fileContent)
        
        if (Array.isArray(mapping)) {
          return mapping.map((item: any) => item.supabaseUrl || item.url).filter(Boolean)
        }
        
        return []
      } catch (error: any) {
        console.error(`[API] Error reading mapping file ${mappingFile}:`, error?.message || error)
        // Continue to next path
      }
    }
  }
  
  // If file system read failed, try fetching from public URL (works in production)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    const publicUrl = `${baseUrl}/${fileName}`
    console.log(`[API] Attempting to fetch mapping file from public URL: ${publicUrl}`)
    
    const response = await fetch(publicUrl)
    if (response.ok) {
      const mapping = await response.json()
      if (Array.isArray(mapping)) {
        const urls = mapping.map((item: any) => item.supabaseUrl || item.url).filter(Boolean)
        console.log(`[API] Successfully loaded ${urls.length} URLs from public URL`)
        return urls
      }
    }
  } catch (error: any) {
    console.error(`[API] Error fetching mapping file from public URL:`, error?.message || error)
  }
  
  return []
}

// Map truck names to their folder names in Supabase Storage
const TRUCK_FOLDER_MAP: Record<string, string> = {
  'Tata 1109g LPT': 'TATA_1109G_LPT',
  'Tata 1412 LPT': 'TATA_1412_LPT',
  'ASHOK LEYLAND ECOMET STAR 1415 HE': 'ASHOK_LEYLAND_ECOMET_STAR_1415_HE',
  'ASHOK LEYLAND ECOMET STAR 1615 HE': 'ASHOK_LEYLAND_ECOMET_STAR_1615_HE',
  'Mahindra Bolero Maxitruck Plus': 'MAHINDRA_BOLERO_MAXITRUCK_PLUS',
  'SML Isuzu Samrat 4760gs': 'SML_ISUZU_SAMRAT_4760GS',
  'Tata 609g': 'TATA_609G',
  'TATA 609G': 'TATA_609G',
  'Tata Motors 609g': 'TATA_609G',
  'Tata 609 g': 'TATA_609G',
  'TATA 609 G': 'TATA_609G',
  'Tata 609 G': 'TATA_609G',
  'Tata 709g LPT': 'TATA_709G_LPT',
  'TATA 709G LPT': 'TATA_709G_LPT',
  'Tata Motors 709g LPT': 'TATA_709G_LPT',
  'Tata 709 g LPT': 'TATA_709G_LPT',
  'Tata 709 G LPT': 'TATA_709G_LPT',
  'TATA 709 G LPT': 'TATA_709G_LPT',
  'EICHER PRO 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher Pro 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher Motors Pro 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher 2059': 'EICHER_2059XP',
  'EICHER 2059': 'EICHER_2059XP',
  'Eicher Motors 2059': 'EICHER_2059XP',
  'Eicher 2059XP': 'EICHER_2059XP',
  'EICHER 2059XP': 'EICHER_2059XP',
  'Eicher Motors 2059XP': 'EICHER_2059XP',
  'Eicher Pro 2059XP': 'EICHER_2059XP',
  'EICHER PRO 2059XP': 'EICHER_2059XP',
  'Eicher Pro 2059': 'EICHER_2059XP',
  'EICHER PRO 2059': 'EICHER_2059XP',
}

// Helper function to find folder name with flexible matching
function getFolderName(truckName: string): string | null {
  // Exact match first
  if (TRUCK_FOLDER_MAP[truckName]) {
    return TRUCK_FOLDER_MAP[truckName]
  }
  
  // Check for Tata 609g variations (case-insensitive, with/without space)
  const normalizedName = truckName.toLowerCase().trim()
  if ((normalizedName.includes('609g') || normalizedName.includes('609 g')) && normalizedName.includes('tata')) {
    return 'TATA_609G'
  }
  
  // Check for Tata 709g LPT variations (case-insensitive, with/without space)
  if ((normalizedName.includes('709g') || normalizedName.includes('709 g')) && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
    return 'TATA_709G_LPT'
  }
  
  // Check for Eicher Pro 1075 F HSD variations (case-insensitive)
  if (normalizedName.includes('1075') && normalizedName.includes('hsd') && normalizedName.includes('eicher')) {
    return 'EICHER_PRO_1075_F_HSD'
  }
  
  // Check for Eicher 2059 variations (case-insensitive, with/without "Pro", with/without "XP")
  if (normalizedName.includes('2059') && normalizedName.includes('eicher')) {
    return 'EICHER_2059XP'
  }
  
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ truckName: string }> }
) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      console.error('Supabase client not initialized. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env')
      return NextResponse.json(
        { error: 'Supabase not configured', details: 'Missing Supabase URL and keys in .env' },
        { status: 500 }
      )
    }

    // Try to get truckName from params first, then from query string as fallback
    let decodedTruckName: string | null = null
    
    try {
      const resolvedParams = await params
      decodedTruckName = decodeURIComponent(resolvedParams.truckName)
    } catch (e) {
      // If params fail, try query string
      const { searchParams } = new URL(request.url)
      decodedTruckName = searchParams.get('truckName')
      if (decodedTruckName) {
        decodedTruckName = decodeURIComponent(decodedTruckName)
      }
    }

    if (!decodedTruckName) {
      return NextResponse.json(
        { error: 'Truck name is required' },
        { status: 400 }
      )
    }
    
    console.log(`[API] [truckName] route: Fetching images for truck: ${decodedTruckName}`)
    
    // ALWAYS try mapping file first (most reliable and fastest)
    const mappingUrls = await loadImagesFromMapping(decodedTruckName)
    if (mappingUrls.length > 0) {
      console.log(`[API] [truckName] route: Loaded ${mappingUrls.length} images from mapping file`)
      return NextResponse.json({ 
        images: mappingUrls,
        count: mappingUrls.length,
        source: 'mapping-file'
      })
    }
    
    // If mapping file doesn't exist, try Supabase Storage (supabase already checked above)
    
    // Get the folder name for this truck (with flexible matching)
    let folderName = getFolderName(decodedTruckName)
    
    // If folder name not found, try to list all folders and find a match
    if (!folderName) {
      console.log(`[API] [truckName] route: Folder not found in mapping, listing available folders...`)
      
      // List all available folders
      const { data: allFolders, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1000 })
      
      if (!listError && allFolders) {
        const hasExt = (n: string) => /\.(jpg|jpeg|png|gif|webp|mp4|mov|pdf|json)$/i.test(n)
        const availableFolders = allFolders.map(f => f.name).filter(n => !hasExt(n))
        console.log(`[API] [truckName] route: Available folders: ${availableFolders.slice(0, 20).join(', ')}`)
        
        const normalizedName = decodedTruckName.toLowerCase().trim()
        
        // Tata Ace Gold (7908) -> folder like "Tata Ace Gold (7908)-20260307T052536Z-1-001"
        if (normalizedName.includes('tata') && normalizedName.includes('ace') && normalizedName.includes('7908')) {
          const aceFolder = availableFolders.find(f => {
            const fl = f.toLowerCase()
            return (fl.includes('tata') && fl.includes('ace') && (fl.includes('7908') || fl.includes('ace gold')))
          })
          if (aceFolder) {
            folderName = aceFolder
            console.log(`[API] [truckName] route: ✅ Found Tata Ace Gold folder: ${folderName}`)
          }
        }
        
        // Check if TATA_609G exists for Tata 609g
        if (!folderName && normalizedName.includes('609') && (normalizedName.includes('tata') || normalizedName.includes('tata motors'))) {
          if (availableFolders.includes('TATA_609G')) {
            folderName = 'TATA_609G'
            console.log(`[API] [truckName] route: ✅ Found TATA_609G folder for "${decodedTruckName}"`)
          }
        }
        
        // Try other pattern matching
        if (!folderName) {
          const normalizedTruckName = normalizedName.replace(/[^a-z0-9]/g, '')
          for (const folder of availableFolders) {
            const normalizedFolder = folder.toLowerCase().replace(/[^a-z0-9]/g, '')
            if (normalizedFolder.includes(normalizedTruckName) ||
                normalizedTruckName.includes(normalizedFolder) ||
                (normalizedTruckName.includes('609') && normalizedFolder.includes('609')) ||
                (normalizedTruckName.includes('709') && normalizedFolder.includes('709')) ||
                (normalizedTruckName.includes('1109') && normalizedFolder.includes('1109')) ||
                (normalizedTruckName.includes('7908') && normalizedFolder.includes('7908'))) {
              folderName = folder
              console.log(`[API] [truckName] route: ✅ Found matching folder: ${folderName}`)
              break
            }
          }
        }
      }
      
      if (!folderName) {
        console.error(`[API] [truckName] route: Could not find folder for: ${decodedTruckName}`)
        return NextResponse.json(
          { 
            error: 'Truck folder not found in Supabase Storage', 
            truckName: decodedTruckName,
            hint: 'Make sure images are uploaded to Supabase Storage for this truck'
          },
          { status: 404 }
        )
      }
    }

    console.log(`[API] Listing files in folder: ${folderName}`)

    // List all files in the truck's folder
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderName, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('[API] Error listing files:', error)
      console.error('[API] Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch images: ' + error.message, details: error },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      console.warn(`[API] No files found in folder: ${folderName}`)
      return NextResponse.json({ images: [], message: 'No files found in folder' })
    }

    console.log(`[API] Found ${files.length} files in folder`)

    // Filter to only image and video files, and generate public URLs
    const imageUrls = files
      .filter(file => {
        const ext = file.name.toLowerCase()
        const isMedia = ext.endsWith('.jpg') || 
               ext.endsWith('.jpeg') || 
               ext.endsWith('.png') || 
               ext.endsWith('.webp') || 
               ext.endsWith('.gif') ||
               ext.endsWith('.mp4') ||
               ext.endsWith('.mov')
        return isMedia
      })
      .map(file => {
        const filePath = `${folderName}/${file.name}`
        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)
        return data.publicUrl
      })

    console.log(`[API] Generated ${imageUrls.length} image URLs`)

    return NextResponse.json({ 
      images: imageUrls,
      count: imageUrls.length,
      folder: folderName
    })
  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
