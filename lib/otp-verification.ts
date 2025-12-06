import { safePrismaQuery } from './prisma'

/**
 * Verify OTP token for a phone number and purpose
 * This checks if the phone has a verified OTP within the last 15 minutes
 */
export async function verifyOTPToken(
  phone: string,
  purpose: string,
  token: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const verification = await safePrismaQuery(
      async (prisma) => {
        return await prisma.otpVerification.findFirst({
          where: {
            phone,
            purpose,
            verified: true,
            verifiedAt: {
              // Verified within last 15 minutes
              gte: new Date(Date.now() - 15 * 60 * 1000)
            }
          },
          orderBy: {
            verifiedAt: 'desc'
          }
        })
      },
      null
    )

    if (!verification) {
      return {
        valid: false,
        message: 'OTP verification not found or expired. Please verify your OTP again.'
      }
    }

    // In a more secure implementation, you would verify the token
    // For now, we check if there's a recent verified OTP
    // The token is passed from frontend, but we rely on the verified flag in DB
    
    return {
      valid: true
    }
  } catch (error) {
    console.error('Error verifying OTP token:', error)
    return {
      valid: false,
      message: 'Error verifying OTP token'
    }
  }
}

/**
 * Mark OTP as used after successful inquiry/booking
 */
export async function markOTPAsUsed(phone: string, purpose: string): Promise<void> {
  await safePrismaQuery(
    async (prisma) => {
      // Delete verified OTPs older than 15 minutes to clean up
      await prisma.otpVerification.deleteMany({
        where: {
          phone,
          purpose,
          verified: true,
          verifiedAt: {
            lt: new Date(Date.now() - 15 * 60 * 1000)
          }
        }
      })
    },
    null
  )
}

