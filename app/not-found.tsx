'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

