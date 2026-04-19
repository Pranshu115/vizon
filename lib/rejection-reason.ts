/** Normalize promise rejection reasons for UI/logging (browsers often reject with Event). */
export function rejectionReasonToMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message || 'Error'
  if (typeof reason === 'string') return reason
  if (typeof ErrorEvent !== 'undefined' && reason instanceof ErrorEvent) {
    return reason.message || 'Browser error'
  }
  if (typeof Event !== 'undefined' && reason instanceof Event) {
    return 'Something went wrong while loading a resource (network or image error).'
  }
  try {
    const s = String(reason)
    if (s === '[object Event]') {
      return 'Something went wrong while loading a resource (network or image error).'
    }
    return s
  } catch {
    return 'Unknown error'
  }
}

export function isLikelyBrowserEventRejection(reason: unknown): boolean {
  if (typeof Event !== 'undefined' && reason instanceof Event) return true
  return typeof reason === 'object' && reason !== null && String(reason) === '[object Event]'
}
