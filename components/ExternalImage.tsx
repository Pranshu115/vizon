'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ExternalImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
}

/**
 * Component to handle external images (especially Supabase Storage URLs)
 * Falls back to regular img tag if Next.js Image fails
 */
export default function ExternalImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  style,
  priority = false,
}: ExternalImageProps) {
  const [useFallback, setUseFallback] = useState(false)
  const isExternal = src?.startsWith('http') || src?.includes('supabase.co')

  // Use regular img tag for external URLs (Supabase, etc.) so they load on localhost and in production
  if (useFallback || isExternal) {
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setUseFallback(true)}
        />
      )
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={() => setUseFallback(true)}
      />
    )
  }

  // Use Next.js Image with unoptimized for external URLs
  try {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          style={style}
          unoptimized={isExternal}
          priority={priority}
          onError={() => setUseFallback(true)}
        />
      )
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        unoptimized={isExternal}
        priority={priority}
        onError={() => setUseFallback(true)}
      />
    )
  } catch (error) {
    // Fallback to regular img tag
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
      />
    )
  }
}
