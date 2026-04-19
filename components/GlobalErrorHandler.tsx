'use client'

import { useEffect } from 'react'
import { isLikelyBrowserEventRejection } from '@/lib/rejection-reason'

/**
 * Swallows promise rejections whose reason is a native browser Event — common when
 * an image/tile/script fails to load and something mis-wires the rejection chain.
 * Prevents Next dev overlay from showing "[object Event]" as a runtime error.
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isLikelyBrowserEventRejection(event.reason)) return
      event.preventDefault()
      event.stopImmediatePropagation?.()
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[GlobalErrorHandler] Suppressed unhandled rejection with an Event reason (often failed image/map tile or script load).'
        )
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return null
}
