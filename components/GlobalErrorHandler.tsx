'use client'

import { useEffect } from 'react'

/**
 * Prevents "[object Event]" from appearing when an Event is accidentally
 * thrown or rejected (e.g. from form handlers or unhandled promise rejections).
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason && typeof reason === 'object' && reason.constructor?.name === 'Event') {
        event.preventDefault()
        console.error('Unhandled promise rejection: received Event object. This may be caused by passing an event handler incorrectly.')
        return true
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return null
}
