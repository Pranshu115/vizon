'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    const message = getErrorMessage(error)
    console.error('Application error:', message)
  }, [error])

  const displayMessage = getErrorMessage(error)

  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>Something went wrong</h2>
      <p style={{ marginBottom: '1.5rem', color: '#6b7280', maxWidth: '400px' }}>
        {displayMessage}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '0.5rem 1.5rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Try again
      </button>
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return (error as Error).message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  // Handle Event objects and other non-Error values that stringify to "[object Event]"
  const str = String(error)
  if (str === '[object Event]') {
    return 'An unexpected event occurred. Please try again.'
  }
  return str || 'An unexpected error occurred.'
}
