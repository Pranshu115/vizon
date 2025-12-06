const { PrismaClient } = require('@prisma/client')

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  
  console.log('\n📊 Database Connection Status Check\n')
  console.log('=' .repeat(50))
  
  // Check if DATABASE_URL is set
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL: NOT SET')
    console.log('📝 Status: Using seed data fallback')
    console.log('\n💡 To connect a database:')
    console.log('   1. Create a PostgreSQL database')
    console.log('   2. Update .env file with:')
    console.log('      DATABASE_URL="postgresql://user:password@localhost:5432/axlerator?schema=public"')
    console.log('   3. Run: npx prisma migrate dev')
    console.log('   4. Run: npm run seed')
    return
  }
  
  // Check if it's a placeholder
  const isPlaceholder = databaseUrl.includes('user:password') || 
                       databaseUrl === 'postgresql://user:password@localhost:5432/axlerator?schema=public'
  
  if (isPlaceholder) {
    console.log('⚠️  DATABASE_URL: PLACEHOLDER DETECTED')
    console.log('📝 Status: Using seed data fallback')
    console.log('\n💡 To connect a real database:')
    console.log('   1. Create a PostgreSQL database')
    console.log('   2. Update .env file with your actual database URL')
    console.log('   3. Run: npx prisma migrate dev')
    console.log('   4. Run: npm run seed')
    return
  }
  
  // Try to connect
  console.log('✅ DATABASE_URL: Configured')
  console.log(`📋 URL: ${databaseUrl.substring(0, 40)}...`)
  
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Connection: SUCCESS')
    
    // Try a simple query
    const count = await prisma.truck.count()
    console.log(`📦 Trucks in database: ${count}`)
    
    await prisma.$disconnect()
    console.log('\n✅ Database is properly connected and working!')
  } catch (error) {
    console.log('❌ Connection: FAILED')
    console.log(`⚠️  Error: ${error.message}`)
    console.log('\n📝 Status: App will use seed data fallback')
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check if PostgreSQL is running')
    console.log('   2. Verify DATABASE_URL is correct')
    console.log('   3. Check database credentials')
    console.log('   4. Ensure database exists')
  }
  
  console.log('=' .repeat(50))
  console.log('')
}

checkDatabase().catch(console.error)

