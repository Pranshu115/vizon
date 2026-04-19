import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'truck-images'

const MEDIA = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov'] as const

function isMediaFile(name: string): boolean {
  const n = name.toLowerCase()
  return MEDIA.some((ext) => n.endsWith(ext))
}

/** Filename has a dotted extension (.pdf, .txt, etc.) — treat as leaf, do not recurse */
function hasExtension(name: string): boolean {
  return /\.[a-z0-9]{1,12}$/i.test(name)
}

/**
 * Lists image/video files under a Storage prefix, recursing into subfolders (uploads often use …/folder/sub/img.jpg).
 */
export async function collectPublicTruckMediaUrls(
  supabase: SupabaseClient,
  prefix: string,
  depth = 0,
  maxDepth = 5
): Promise<string[]> {
  if (depth > maxDepth) return []
  const { data: entries, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 500,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error || !entries?.length) return []

  const urls: string[] = []
  for (const e of entries) {
    const childPath = `${prefix}/${e.name}`
    if (isMediaFile(e.name)) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(childPath)
      urls.push(data.publicUrl)
    } else if (!hasExtension(e.name)) {
      urls.push(...(await collectPublicTruckMediaUrls(supabase, childPath, depth + 1, maxDepth)))
    }
  }
  return urls
}
