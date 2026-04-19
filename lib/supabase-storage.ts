/**
 * Builds the public Storage URL base for the `truck-images` bucket using
 * NEXT_PUBLIC_SUPABASE_URL so local, preview, and production match your project.
 */
export function publicTruckImagesRoot(): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  if (!root) return ''
  return `${root}/storage/v1/object/public/truck-images`
}

/**
 * Rewrites any Supabase project's `.../storage/v1/object/public/truck-images/...`
 * URL to use NEXT_PUBLIC_SUPABASE_URL (same path within the bucket).
 * Use after migrating Storage or when JSON/mappings still reference an old project ref.
 */
export function rewriteTruckImagesStorageUrlToCurrentProject(url: string): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  if (!root || !url || typeof url !== 'string') return url
  const m = url
    .trim()
    .match(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/truck-images\/(.+)$/i)
  if (!m?.[1]) return url
  return `${root}/storage/v1/object/public/truck-images/${m[1]}`
}

export function rewriteTruckImagesStorageUrls(urls: string[]): string[] {
  return urls.map(rewriteTruckImagesStorageUrlToCurrentProject)
}
