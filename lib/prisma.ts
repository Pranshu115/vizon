import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Type guard to check if Prisma client is properly initialized
function isPrismaClient(client: unknown): client is PrismaClient {
  return (
    typeof client === 'object' &&
    client !== null &&
    '$connect' in client &&
    typeof (client as PrismaClient).$connect === 'function'
  )
}

// Create Prisma client with error handling
let prismaInstance: PrismaClient | null = null

// Check if DATABASE_URL is set and valid (not placeholder)
const databaseUrl = process.env.DATABASE_URL
const isPlaceholderUrl = databaseUrl && (
  databaseUrl === 'postgresql://user:password@localhost:5432/axlerator?schema=public' ||
  databaseUrl.includes('user:password')
)
const hasValidDatabaseUrl = databaseUrl && !isPlaceholderUrl && databaseUrl.startsWith('postgresql://')

if (hasValidDatabaseUrl) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    
    // Test connection on startup (non-blocking)
    prismaInstance.$connect().catch(() => {
      console.warn('⚠️  Database connection failed. App will continue with seed data.')
      prismaInstance = null
    })
  } catch (error: any) {
    // Handle Prisma initialization errors gracefully
    if (error?.message?.includes('Environment variable not found') || 
        error?.message?.includes('DATABASE_URL')) {
      console.warn('⚠️  DATABASE_URL not properly configured. App will use seed data.')
    } else {
      console.warn('⚠️  Prisma client initialization failed. App will continue with seed data.')
    }
    prismaInstance = null
  }
} else {
  // Don't initialize Prisma if DATABASE_URL is missing or invalid
  // This prevents Prisma from throwing validation errors
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL not found. App will use seed data. Create a .env file with DATABASE_URL to use a database.')
  } else if (isPlaceholderUrl) {
    console.warn('⚠️  DATABASE_URL appears to be a placeholder. App will use seed data. Update .env with a valid database URL.')
  }
  prismaInstance = null
}

export const prisma: PrismaClient | null = prismaInstance

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Helper function to safely execute Prisma queries
export async function safePrismaQuery<T>(
  queryFn: (prisma: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    // Check if prisma is properly initialized
    if (!prisma || !isPrismaClient(prisma)) {
      return fallback
    }
    return await queryFn(prisma)
  } catch (error) {
    // Check if it's a connection error
    const isConnectionError =
      error &&
      typeof error === 'object' &&
      ('code' in error || 'message' in error) &&
      (
        (error as { code?: string }).code === 'P1001' ||
        (error as { message?: string }).message?.includes('denied access') ||
        (error as { message?: string }).message?.includes('not available')
      )

    if (isConnectionError) {
      console.warn('Database not available, using fallback data')
      return fallback
    }
    console.error('Prisma query error:', error)
    return fallback
  }
}
