/**
 * Builds the public Storage URL base for the `truck-images` bucket using
 * NEXT_PUBLIC_SUPABASE_URL so local, preview, and production match your project.
 */
export function publicTruckImagesRoot(): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  if (!root) return ''
  return `${root}/storage/v1/object/public/truck-images`
}
