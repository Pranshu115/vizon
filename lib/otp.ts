import crypto from 'crypto'

/**
 * Generate a random OTP code
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/**
 * Verify OTP against hash
 */
export function verifyOTP(otp: string, hash: string): boolean {
  const otpHash = hashOTP(otp)
  return crypto.timingSafeEqual(
    Buffer.from(otpHash),
    Buffer.from(hash)
  )
}

/**
 * Calculate OTP expiration time
 */
export function getOTPExpiry(minutes: number = 10): Date {
  const expiryMinutes = parseInt(
    process.env.OTP_EXPIRY_MINUTES || minutes.toString(),
    10
  )
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes)
  return expiry
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Get OTP length from environment or default
 */
export function getOTPLength(): number {
  return parseInt(process.env.OTP_LENGTH || '6', 10)
}

/**
 * Get max OTP attempts from environment or default
 */
export function getOTPMaxAttempts(): number {
  return parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)
}

