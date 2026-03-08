import twilio from 'twilio'

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const phoneNumber = process.env.TWILIO_PHONE_NUMBER

// Lazy initialization of Twilio client to avoid build-time errors
let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient
  }
  
  // Only initialize if credentials are valid
  if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
      twilioClient = twilio(accountSid, authToken)
      return twilioClient
    } catch (error) {
      console.warn('Failed to initialize Twilio client:', error)
      return null
    }
  }
  
  return null
}

/**
 * Send OTP via SMS using Twilio
 */
export async function sendOTP(phone: string, otp: string, purpose: string = 'verification'): Promise<{ success: boolean; message?: string; error?: string }> {
  // Check if Twilio is configured
  const client = getTwilioClient()
  if (!client || !phoneNumber) {
    console.warn('⚠️  Twilio not configured. OTP would be:', otp)
    // In development, log the OTP instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP for ${phone}: ${otp} (Purpose: ${purpose})`)
      return {
        success: true,
        message: 'OTP logged in development mode (Twilio not configured)'
      }
    }
    return {
      success: false,
      error: 'SMS service not configured'
    }
  }

  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/^\+/, '')}`
    
    // Create OTP message based on purpose
    let message = ''
    switch (purpose) {
      case 'inquiry':
      case 'booking':
        message = `Your OTP for truck booking is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`
        break
      case 'test_drive':
        message = `Your OTP for test drive booking is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`
        break
      default:
        message = `Your verification code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`
    }

    // Send SMS via Twilio
    const messageResponse = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: formattedPhone
    })

    if (messageResponse.sid) {
      return {
        success: true,
        message: 'OTP sent successfully'
      }
    } else {
      return {
        success: false,
        error: 'Failed to send OTP'
      }
    }
  } catch (error: any) {
    console.error('Error sending OTP via Twilio:', error)
    return {
      success: false,
      error: error.message || 'Failed to send OTP'
    }
  }
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return !!(accountSid && authToken && phoneNumber)
}

