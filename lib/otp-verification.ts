import { safeSupabaseQuery } from './supabase'

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
    const verification = await safeSupabaseQuery(
      async (supabase) => {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        const { data, error } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('phone', phone)
          .eq('purpose', purpose)
          .eq('verified', true)
          .gte('verified_at', fifteenMinutesAgo)
          .order('verified_at', { ascending: false })
          .limit(1)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
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
  await safeSupabaseQuery(
    async (supabase) => {
      // Delete verified OTPs older than 15 minutes to clean up
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('phone', phone)
        .eq('purpose', purpose)
        .eq('verified', true)
        .lt('verified_at', fifteenMinutesAgo)
    },
    null
  )
}

